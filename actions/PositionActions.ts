"use server";
import {
  category,
  pyramidCategory,
  team,
  position,
  users,
  profile,
} from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, and, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper function to generate team display name
function getTeamDisplayName(
  player1: {
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  },
  player2: {
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  }
): string {
  // If both players have nicknames, use those
  if (player1.nickname && player2.nickname) {
    return `${player1.nickname} / ${player2.nickname}`;
  }

  // If only one has nickname, use nickname + surname
  if (player1.nickname && !player2.nickname) {
    return `${player1.nickname} / ${player2.paternalSurname}`;
  }

  if (!player1.nickname && player2.nickname) {
    return `${player1.paternalSurname} / ${player2.nickname}`;
  }

  // Default: use both paternal surnames
  return `${player1.paternalSurname} / ${player2.paternalSurname}`;
}

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
  };
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
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

    if (existingPosition.length > 0) {
      // Update existing position
      const result = await db
        .update(position)
        .set({
          teamId,
          updatedAt: new Date(),
        })
        .where(eq(position.id, existingPosition[0].id))
        .returning();

      if (result.length === 0) {
        throw new Error("Failed to update position");
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
        throw new Error("Failed to create position");
      }
    }

    // Revalidate the page to reflect changes
    revalidatePath(`/piramides/${pyramidId}/posiciones`);
    revalidatePath(`/piramides/${pyramidId}`);

    return { success: true };
  } catch (error) {
    console.error("Error posicionando equipo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ocurrió un error desconocido",
    };
  }
}

export async function moveTeamPosition(
  pyramidId: number,
  teamId: number,
  newRow: number,
  newCol: number
) {
  try {
    // Check if the new position is already occupied
    const existingPosition = await db
      .select()
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          eq(position.row, newRow),
          eq(position.col, newCol)
        )
      )
      .limit(1);

    if (existingPosition.length > 0 && existingPosition[0].teamId !== teamId) {
      return {
        success: false,
        error: "La posición ya está ocupada por otro equipo",
      };
    }

    // Update team's position
    const result = await db
      .update(position)
      .set({
        row: newRow,
        col: newCol,
        updatedAt: new Date(),
      })
      .where(
        and(eq(position.pyramidId, pyramidId), eq(position.teamId, teamId))
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Team position not found" };
    }

    // Revalidate the page to reflect changes
    revalidatePath(`/piramides/${pyramidId}/posiciones`);
    revalidatePath(`/piramides/${pyramidId}`);

    return { success: true };
  } catch (error) {
    console.error("Error moving team position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function removeTeamFromPosition(
  positionId: number,
  pyramidId?: number
) {
  try {
    const result = await db
      .delete(position)
      .where(eq(position.id, positionId))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Position not found" };
    }

    // Revalidate the page to reflect changes
    if (pyramidId) {
      revalidatePath(`/piramides/${pyramidId}/posiciones`);
      revalidatePath(`/piramides/${pyramidId}`);
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

export async function removeTeamFromPyramid(pyramidId: number, teamId: number) {
  try {
    const result = await db
      .delete(position)
      .where(
        and(eq(position.pyramidId, pyramidId), eq(position.teamId, teamId))
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Team not found in pyramid" };
    }

    // Revalidate the page to reflect changes
    revalidatePath(`/piramides/${pyramidId}/posiciones`);
    revalidatePath(`/piramides/${pyramidId}`);

    return { success: true };
  } catch (error) {
    console.error("Error removing team from pyramid:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Utility function to check if a user can manage a specific team
export async function canUserManageTeam(
  userId: string,
  teamId: number
): Promise<boolean> {
  try {
    const result = await db
      .select({ id: team.id })
      .from(team)
      .where(
        and(
          eq(team.id, teamId),
          or(eq(team.player1Id, userId), eq(team.player2Id, userId))
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking team management permissions:", error);
    return false;
  }
}

// Get team position in a specific pyramid
export async function getTeamPosition(pyramidId: number, teamId: number) {
  try {
    const result = await db
      .select({
        id: position.id,
        row: position.row,
        col: position.col,
      })
      .from(position)
      .where(
        and(eq(position.pyramidId, pyramidId), eq(position.teamId, teamId))
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching team position:", error);
    return null;
  }
}
