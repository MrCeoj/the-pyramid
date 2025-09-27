"use server";
import {
  category,
  pyramidCategory,
  team,
  position,
  users,
  profile,
  positionHistory,
  match,
  pyramid,
} from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, and, inArray, lt } from "drizzle-orm";
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

interface TeamPosition {
  teamId: number;
  pyramidId: number;
  row: number;
  col: number;
}

interface SwapPositions {
  currentTeam: TeamPosition;
  swapWithTeam: TeamPosition;
}

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

/**
 * Processes expired matches (pending for 48+ hours) and swaps non-responsive teams
 * with the team behind them in the pyramid hierarchy
 */
export async function processExpiredMatches(): Promise<void> {
  console.log("Starting expired matches processing...");

  try {
    // Find matches that are pending for 48+ hours
    const expiredMatches = await db
      .select({
        id: match.id,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        createdAt: match.createdAt,
      })
      .from(match)
      .where(
        and(
          eq(match.status, "pending"),
          lt(match.createdAt, new Date(Date.now() - 48 * 60 * 60 * 1000)) // 48 hours ago
        )
      );

    if (expiredMatches.length === 0) {
      console.log("No expired matches found");
      return;
    }

    console.log(`Found ${expiredMatches.length} expired matches`);

    // Group matches by pyramid to process them efficiently
    const matchesByPyramid = expiredMatches.reduce((acc, match) => {
      if (!acc[match.pyramidId]) {
        acc[match.pyramidId] = [];
      }
      acc[match.pyramidId].push(match);
      return acc;
    }, {} as Record<number, typeof expiredMatches>);

    // Process each pyramid separately
    for (const [pyramidIdStr, pyramidMatches] of Object.entries(
      matchesByPyramid
    )) {
      const pyramidId = parseInt(pyramidIdStr);
      await processExpiredMatchesForPyramid(pyramidId, pyramidMatches);
    }

    console.log("Expired matches processing completed");
  } catch (error) {
    console.error("Error processing expired matches:", error);
    throw error;
  }
}

/**
 * Processes expired matches for a specific pyramid
 */
async function processExpiredMatchesForPyramid(
  pyramidId: number,
  expiredMatches: Array<{
    id: number;
    pyramidId: number;
    challengerTeamId: number;
    defenderTeamId: number;
    createdAt: Date | null;
  }>
): Promise<void> {
  console.log(
    `Processing ${expiredMatches.length} expired matches for pyramid ${pyramidId}`
  );

  // Get pyramid info
  const pyramidInfo = await db
    .select({
      id: pyramid.id,
      row_amount: pyramid.row_amount,
    })
    .from(pyramid)
    .where(eq(pyramid.id, pyramidId))
    .limit(1);

  if (pyramidInfo.length === 0) {
    console.error(`Pyramid ${pyramidId} not found`);
    return;
  }

  const { row_amount } = pyramidInfo[0];

  // Get all current positions for this pyramid
  const currentPositions = await db
    .select({
      teamId: position.teamId,
      pyramidId: position.pyramidId,
      row: position.row,
      col: position.col,
    })
    .from(position)
    .where(eq(position.pyramidId, pyramidId));

  // Create a map for quick position lookups
  const positionMap = new Map<number, TeamPosition>();
  currentPositions.forEach((pos) => {
    positionMap.set(pos.teamId, pos);
  });

  // Identify teams that need to be swapped (defender teams that didn't respond)
  const teamsToSwap = new Set<number>();
  expiredMatches.forEach((expiredMatch) => {
    // The defender team is the one that should have responded
    teamsToSwap.add(expiredMatch.defenderTeamId);
  });

  // Calculate swap operations
  const swapOperations: SwapPositions[] = [];
  for (const teamId of teamsToSwap) {
    const currentPos = positionMap.get(teamId);
    if (!currentPos) {
      console.warn(`Team ${teamId} not found in pyramid ${pyramidId}`);
      continue;
    }

    const swapWithPos = getNextPosition(currentPos, row_amount!);
    if (!swapWithPos) {
      console.log(`Team ${teamId} is at the last position, no swap needed`);
      continue;
    }

    // Find the team at the swap position
    const swapWithTeam = currentPositions.find(
      (pos) => pos.row === swapWithPos.row && pos.col === swapWithPos.col
    );

    if (!swapWithTeam) {
      console.warn(
        `No team found at position (${swapWithPos.row}, ${swapWithPos.col})`
      );
      continue;
    }

    swapOperations.push({
      currentTeam: currentPos,
      swapWithTeam: swapWithTeam,
    });
  }

  // Execute swaps and cancel matches in a transaction
  await db.transaction(async (tx) => {
    // Cancel all expired matches
    const expiredMatchIds = expiredMatches.map((m) => m.id);
    await tx
      .update(match)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(inArray(match.id, expiredMatchIds));

    // Execute position swaps
    for (const swap of swapOperations) {
      await executePositionSwap(tx, swap, pyramidId);
    }

    console.log(
      `Cancelled ${expiredMatchIds.length} matches and executed ${swapOperations.length} position swaps`
    );
  });
}

/**
 * Gets the next position in the pyramid hierarchy (the position to swap with)
 */
function getNextPosition(
  currentPos: TeamPosition,
  rowAmount: number
): { row: number; col: number } | null {
  const { row, col } = currentPos;

  // Check if this is the very last position in the pyramid
  if (row === rowAmount && col === row) {
    return null; // No swap for the last position
  }

  // If not in the last column of the row, move to next column
  if (col < row) {
    return { row, col: col + 1 };
  }

  // If in the last column of the row, move to first position of next row
  if (row < rowAmount) {
    return { row: row + 1, col: 1 };
  }

  // This shouldn't happen if the pyramid is properly structured
  return null;
}

/**
 * Executes a position swap between two teams
 */
async function executePositionSwap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any, // Transaction object
  swap: SwapPositions,
  pyramidId: number
): Promise<void> {
  const { currentTeam, swapWithTeam } = swap;

  // Record the position change in history
  await tx.insert(positionHistory).values({
    pyramidId,
    teamId: currentTeam.teamId,
    affectedTeamId: swapWithTeam.teamId,
    oldRow: currentTeam.row,
    oldCol: currentTeam.col,
    newRow: swapWithTeam.row,
    newCol: swapWithTeam.col,
    affectedOldRow: swapWithTeam.row,
    affectedOldCol: swapWithTeam.col,
    affectedNewRow: currentTeam.row,
    affectedNewCol: currentTeam.col,
    effectiveDate: new Date(),
  });

  // Update positions - swap the teams
  await tx
    .update(position)
    .set({
      row: swapWithTeam.row,
      col: swapWithTeam.col,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(position.pyramidId, pyramidId),
        eq(position.teamId, currentTeam.teamId)
      )
    );

  await tx
    .update(position)
    .set({
      row: currentTeam.row,
      col: currentTeam.col,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(position.pyramidId, pyramidId),
        eq(position.teamId, swapWithTeam.teamId)
      )
    );

  console.log(
    `Swapped team ${currentTeam.teamId} from (${currentTeam.row},${currentTeam.col}) ` +
      `with team ${swapWithTeam.teamId} from (${swapWithTeam.row},${swapWithTeam.col})`
  );
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
