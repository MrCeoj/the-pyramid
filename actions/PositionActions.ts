"use server";
import {
  category,
  pyramidCategory,
  team,
  position,
  users,
  profile,
  positionHistory,
} from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTeamDisplayName } from "@/db/schema";

export type TeamWithPlayers = {
  id: number;
  displayName: string;
  wins: number;
  losses: number;
  status: "winner" | "looser" | "idle" | "risky";
  categoryId: number | null;
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
    email?: string | null;
  };
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
    email?: string | null;
  };
};

export async function getApplicableTeams(
  pyramidId: number
): Promise<TeamWithPlayers[]> {
  try {
    // Get categories for this pyramid
    const categories = await db
      .select({ id: category.id })
      .from(category)
      .innerJoin(pyramidCategory, eq(pyramidCategory.categoryId, category.id))
      .where(eq(pyramidCategory.pyramidId, pyramidId));

    const categoryIds = categories.map(({ id }) => id);

    if (categoryIds.length === 0) {
      return [];
    }

    // Get teams in those categories with player data
    const teamsData = await db
      .select({
        id: team.id,
        wins: team.wins,
        losses: team.losses,
        status: team.status,
        categoryId: team.categoryId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
      })
      .from(team)
      .where(inArray(team.categoryId, categoryIds))
      .innerJoin(users, eq(team.player1Id, users.id))
      .leftJoin(profile, eq(users.id, profile.userId));

    const teams: TeamWithPlayers[] = await Promise.all(
      teamsData.map(async (teamData) => {
        const player2Data = await db
          .select({
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            nickname: profile.nickname,
          })
          .from(users)
          .where(eq(users.id, teamData.player2Id!)) // <-- non-null assertion
          .leftJoin(profile, eq(users.id, profile.userId))
          .limit(1);

        const player1 = {
          id: teamData.player1Id!,
          paternalSurname: teamData.player1PaternalSurname,
          maternalSurname: teamData.player1MaternalSurname,
          nickname: teamData.player1Nickname,
        };

        const player2 = {
          id: teamData.player2Id!,
          paternalSurname: player2Data[0]?.paternalSurname || "",
          maternalSurname: player2Data[0]?.maternalSurname || "",
          nickname: player2Data[0]?.nickname,
        };

        return {
          id: teamData.id,
          displayName: getTeamDisplayName(player1, player2),
          wins: teamData.wins || 0,
          losses: teamData.losses || 0,
          status: teamData.status || "idle",
          categoryId: teamData.categoryId,
          player1,
          player2,
        };
      })
    );

    console.log(teams)

    return teams;
  } catch (error) {
    console.error("Error fetching applicable teams:", error);
    return [];
  }
}

export async function getAvailableTeams(
  pyramidId: number
): Promise<TeamWithPlayers[]> {
  try {
    // Get all applicable teams
    const applicableTeams = await getApplicableTeams(pyramidId);

    // Get teams that are already positioned in this pyramid
    const positionedTeams = await db
      .select({ teamId: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    const positionedTeamIds = positionedTeams.map((p) => p.teamId);

    // Filter out teams that are already positioned
    const availableTeams = applicableTeams.filter(
      (team) => !positionedTeamIds.includes(team.id)
    );

    return availableTeams;
  } catch (error) {
    console.error("Error fetching available teams:", error);
    return [];
  }
}

export async function setTeamInPosition(
  pyramidId: number,
  teamId: number,
  row: number,
  col: number
) {
  try {
    // Check if team is already positioned in this pyramid
    const existingTeamPosition = await db
      .select()
      .from(position)
      .where(
        and(eq(position.pyramidId, pyramidId), eq(position.teamId, teamId))
      )
      .limit(1);

    if (existingTeamPosition.length > 0) {
      return {
        success: false,
        error: "Este equipo ya está posicionado en esta pirámide",
      };
    }

    // Check if position already exists
    const existingPosition = await db
      .select()
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          eq(position.row, row),
          eq(position.col, col)
        )
      )
      .limit(1);

    let displacedTeamId: number | null = null;

    if (existingPosition.length > 0) {
      // Store the displaced team info for history
      displacedTeamId = existingPosition[0].teamId;

      // Record the displacement/removal of the old team
      await db.insert(positionHistory).values({
        pyramidId,
        matchId: null, // Admin action, not match-related
        teamId: displacedTeamId,
        affectedTeamId: teamId,
        oldRow: row,
        oldCol: col,
        newRow: null, // Team was removed/displaced
        newCol: null,
        affectedOldRow: null, // New team had no previous position
        affectedOldCol: null,
        affectedNewRow: row, // New team gets this position
        affectedNewCol: col,
        effectiveDate: new Date(),
      });

      // Update existing position with new team
      const result = await db
        .update(position)
        .set({
          teamId,
          updatedAt: new Date(),
        })
        .where(eq(position.id, existingPosition[0].id))
        .returning();

      if (result.length === 0) {
        throw new Error("No se actualizaron las posiciones en los registros");
      }
    } else {
      // Create new position
      const result = await db
        .insert(position)
        .values({
          pyramidId,
          teamId,
          row,
          col,
        })
        .returning();

      if (result.length === 0) {
        throw new Error("No se crearon las nuevas posiciones");
      }
    }

    // Record the placement of the new team
    await db.insert(positionHistory).values({
      pyramidId,
      matchId: null,
      teamId: teamId,
      affectedTeamId: displacedTeamId,
      oldRow: null,
      oldCol: null,
      newRow: row,
      newCol: col,
      affectedOldRow: displacedTeamId ? row : null,
      affectedOldCol: displacedTeamId ? col : null,
      affectedNewRow: null,
      affectedNewCol: null,
      effectiveDate: new Date(),
    });

    revalidatePath(`/piramides/${pyramidId}/posiciones`);
    revalidatePath(`/piramides/${pyramidId}`);
    return { success: true };
  } catch (error) {
    console.error("Error posicionando equipo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ocurrió un error desconocido",
    };
  }
}

export async function removeTeamFromPosition(
  positionId: number,
  pyramidId?: number
) {
  try {
    // Get position info before deleting for history
    const positionInfo = await db
      .select({
        teamId: position.teamId,
        pyramidId: position.pyramidId,
        row: position.row,
        col: position.col,
      })
      .from(position)
      .where(eq(position.id, positionId))
      .limit(1);

    if (positionInfo.length === 0) {
      return { success: false, error: "Position not found" };
    }

    const { teamId, pyramidId: positionPyramidId, row, col } = positionInfo[0];

    // Delete the position
    const result = await db
      .delete(position)
      .where(eq(position.id, positionId))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Position not found" };
    }

    // Record the removal in history
    await db.insert(positionHistory).values({
      pyramidId: positionPyramidId,
      matchId: null,
      teamId: teamId,
      affectedTeamId: null,
      oldRow: row,
      oldCol: col,
      newRow: null,
      newCol: null,
      affectedOldRow: null,
      affectedOldCol: null,
      affectedNewRow: null,
      affectedNewCol: null,
      effectiveDate: new Date(),
    });

    if (pyramidId) {
      revalidatePath(`/piramides/${pyramidId}/posiciones`);
      revalidatePath(`/piramides/${pyramidId}`);
    } else {
      revalidatePath(`/piramides/${positionPyramidId}/posiciones`);
      revalidatePath(`/piramides/${positionPyramidId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing team from position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

