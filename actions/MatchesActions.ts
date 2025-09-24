"use server";
import { db } from "@/lib/drizzle";
import { eq, or, and, desc } from "drizzle-orm";
import {
  match,
  team,
  pyramid,
  profile,
  position,
  positionHistory,
  users,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getTeamDisplayName } from "@/db/schema";

// Updated types for new schema
export type TeamInfo = {
  id: number;
  displayName: string;
  categoryId: number | null;
  wins: number;
  losses: number;
  status: "winner" | "looser" | "idle" | "risky";
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname: string | null;
  };
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname: string | null;
  };
};

export type MatchWithDetails = {
  id: number;
  status: "pending" | "accepted" | "played" | "rejected" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: TeamInfo;
  defenderTeam: TeamInfo;
  winnerTeam?: TeamInfo | null;
  evidenceUrl?: string | null;
};

export type UnresolvedMatch = {
  id: number;
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  status: "pending" | "accepted";
  createdAt: Date;
};

export type AcceptedMatchWithDetails = {
  id: number;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: TeamInfo & {
    currentRow: number;
    currentCol: number;
  };
  defenderTeam: TeamInfo & {
    currentRow: number;
    currentCol: number;
  };
  createdAt: Date;
};

export type MatchResult = {
  success: boolean;
  message: string;
};

export type MatchCompletionResult = {
  success: boolean;
  message: string;
};

// Helper function to get team info with players
async function getTeamInfo(teamId: number): Promise<TeamInfo | null> {
  const teamData = await db
    .select({
      id: team.id,
      categoryId: team.categoryId,
      wins: team.wins,
      losses: team.losses,
      status: team.status,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
    })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (!teamData.length) return null;

  const teamRecord = teamData[0];
  
  // Create queries only for non-null player IDs
  const playerQueries = [];
  
  if (teamRecord.player1Id) {
    playerQueries.push(
      db.select({
        id: users.id,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        nickname: profile.nickname,
      })
      .from(users)
      .where(eq(users.id, teamRecord.player1Id))
      .leftJoin(profile, eq(users.id, profile.userId))
      .limit(1)
      .then(result => ({ playerIndex: 1, data: result }))
    );
  }
  
  if (teamRecord.player2Id) {
    playerQueries.push(
      db.select({
        id: users.id,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        nickname: profile.nickname,
      })
      .from(users)
      .where(eq(users.id, teamRecord.player2Id))
      .leftJoin(profile, eq(users.id, profile.userId))
      .limit(1)
      .then(result => ({ playerIndex: 2, data: result }))
    );
  }

  // If no players at all, return null
  if (playerQueries.length === 0) return null;

  const playersResults = await Promise.all(playerQueries);
  
  // Initialize players as null
  let player1 = null;
  let player2 = null;
  
  // Process results and assign to correct player slots
  for (const result of playersResults) {
    if (result.data.length > 0) {
      const playerData = {
        id: result.data[0].id,
        paternalSurname: result.data[0].paternalSurname,
        maternalSurname: result.data[0].maternalSurname,
        nickname: result.data[0].nickname,
      };
      
      if (result.playerIndex === 1) {
        player1 = playerData;
      } else {
        player2 = playerData;
      }
    }
  }

  if (!player1){
    player1 = {id: "", maternalSurname: "", paternalSurname: "", nickname: ""}
  }
  
  if (!player2){
    player2 = {id: "", maternalSurname: "", paternalSurname: "", nickname: ""}
  }
  

  // If we have at least one valid player, create the team
  if (player1 || player2) {
    return {
      id: teamRecord.id,
      displayName: getTeamDisplayName(player1, player2),
      categoryId: teamRecord.categoryId,
      wins: teamRecord.wins || 0,
      losses: teamRecord.losses || 0,
      status: teamRecord.status || "idle",
      player1,
      player2,
    };
  }

  return null;
}

// Check if user belongs to a team
async function getUserTeamIds(userId: string): Promise<number[]> {
  const userTeams = await db
    .select({ id: team.id })
    .from(team)
    .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

  return userTeams.map((t) => t.id);
}

export async function createMatch({
  pyramidId,
  challengerTeamId,
  defenderTeamId,
  userId,
}: {
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  userId: string;
}) {
  try {
    // Verify user belongs to challenger team
    const userTeamIds = await getUserTeamIds(userId);
    if (!userTeamIds.includes(challengerTeamId)) {
      return {
        success: false,
        error: "No tienes permisos para crear este desafío",
      };
    }

    // Check if teams exist and are in the pyramid
    const [challengerPos, defenderPos] = await Promise.all([
      db
        .select({ id: position.id })
        .from(position)
        .where(
          and(
            eq(position.teamId, challengerTeamId),
            eq(position.pyramidId, pyramidId)
          )
        )
        .limit(1),
      db
        .select({ id: position.id })
        .from(position)
        .where(
          and(
            eq(position.teamId, defenderTeamId),
            eq(position.pyramidId, pyramidId)
          )
        )
        .limit(1),
    ]);

    if (!challengerPos.length || !defenderPos.length) {
      return {
        success: false,
        error: "Uno o ambos equipos no están en esta pirámide",
      };
    }

    // Check for existing unresolved matches between these teams
    const existingMatch = await db
      .select({ id: match.id })
      .from(match)
      .where(
        and(
          eq(match.pyramidId, pyramidId),
          or(
            and(
              eq(match.challengerTeamId, challengerTeamId),
              eq(match.defenderTeamId, defenderTeamId)
            ),
            and(
              eq(match.challengerTeamId, defenderTeamId),
              eq(match.defenderTeamId, challengerTeamId)
            )
          ),
          or(eq(match.status, "pending"), eq(match.status, "accepted"))
        )
      )
      .limit(1);

    if (existingMatch.length > 0) {
      return {
        success: false,
        error: "Ya existe un desafío pendiente entre estos equipos",
      };
    }

    const [newMatch] = await db
      .insert(match)
      .values({
        pyramidId,
        challengerTeamId,
        defenderTeamId,
        status: "pending",
      })
      .returning();

    revalidatePath("/mis-retas");
    return { success: true, match: newMatch };
  } catch (err) {
    console.error("Error creating match:", err);
    return { success: false, error: "No se pudo establecer la reta" };
  }
}

export async function getUserMatches(userId: string): Promise<{
  pendingMatches: MatchWithDetails[];
  matchHistory: MatchWithDetails[];
}> {
  try {
    // Get all teams user belongs to
    const userTeamIds = await getUserTeamIds(userId);

    if (userTeamIds.length === 0) {
      return { pendingMatches: [], matchHistory: [] };
    }

    // Get all matches where user's teams are involved
    const matches = await db
      .select({
        id: match.id,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        winnerTeamId: match.winnerTeamId,
        evidenceUrl: match.evidenceUrl,
        pyramidName: pyramid.name,
      })
      .from(match)
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .where(
        or(
          ...userTeamIds.map((teamId) =>
            or(
              eq(match.challengerTeamId, teamId),
              eq(match.defenderTeamId, teamId)
            )
          )
        )
      )
      .orderBy(desc(match.createdAt));

    // Get team info for all involved teams
    const teamIds = new Set<number>();
    matches.forEach((m) => {
      teamIds.add(m.challengerTeamId);
      teamIds.add(m.defenderTeamId);
      if (m.winnerTeamId) teamIds.add(m.winnerTeamId);
    });

    console.log(Array.from(teamIds))

    const teamInfoMap = new Map<number, TeamInfo>();
    await Promise.all(
      Array.from(teamIds).map(async (teamId) => {
        const teamInfo = await getTeamInfo(teamId);
        console.log(teamInfo)
        if (teamInfo) {
          teamInfoMap.set(teamId, teamInfo);
        }
      })
    );

    console.log(teamInfoMap)

    const matchesWithDetails: MatchWithDetails[] = matches.map((m) => {
      const challengerTeam = teamInfoMap.get(m.challengerTeamId);
      const defenderTeam = teamInfoMap.get(m.defenderTeamId);
      const winnerTeam = m.winnerTeamId
        ? teamInfoMap.get(m.winnerTeamId)
        : null;
      console.log("challenger:", challengerTeam)
      console.log("defender:",defenderTeam)
      if (!challengerTeam || !defenderTeam) {
        throw new Error(`Missing team data for match ${m.id}`);
      }

      return {
        id: m.id,
        status: m.status,
        createdAt: m.createdAt!,
        updatedAt: m.updatedAt!,
        pyramidId: m.pyramidId,
        pyramidName: m.pyramidName || "Pirámide sin nombre",
        challengerTeam,
        defenderTeam,
        winnerTeam,
        evidenceUrl: m.evidenceUrl,
      };
    });

    // Separate pending matches (where user is defender) from history
    const pendingMatches = matchesWithDetails.filter(
      (m) => m.status === "pending" && userTeamIds.includes(m.defenderTeam.id)
    );

    const matchHistory = matchesWithDetails.filter(
      (m) => m.status !== "pending"
    );
    console.log({ pendingMatches, matchHistory })
    return { pendingMatches, matchHistory };
  } catch (error) {
    console.error("Error fetching user matches:", error);
    return { pendingMatches: [], matchHistory: [] };
  }
}

export async function acceptMatch(
  matchId: number,
  userId: string
): Promise<MatchResult> {
  try {
    // Get match info to verify user can accept it
    const matchData = await db
      .select({
        defenderTeamId: match.defenderTeamId,
        status: match.status,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) {
      return { success: false, message: "Desafío no encontrado" };
    }

    if (matchData[0].status !== "pending") {
      return { success: false, message: "Este desafío ya no está pendiente" };
    }

    // Verify user belongs to defender team
    const userTeamIds = await getUserTeamIds(userId);
    if (!userTeamIds.includes(matchData[0].defenderTeamId)) {
      return {
        success: false,
        message: "No tienes permisos para aceptar este desafío",
      };
    }

    await db
      .update(match)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    revalidatePath("/mis-retas");
    return {
      success: true,
      message: "Desafío aceptado. ¡Prepárate para el combate!",
    };
  } catch (error) {
    console.error("Error accepting match:", error);
    return {
      success: false,
      message: "Error al aceptar el desafío. Intenta de nuevo.",
    };
  }
}

export async function rejectMatch(
  matchId: number,
  userId: string
): Promise<MatchResult> {
  try {
    // Similar validation as acceptMatch
    const matchData = await db
      .select({
        defenderTeamId: match.defenderTeamId,
        status: match.status,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) {
      return { success: false, message: "Desafío no encontrado" };
    }

    if (matchData[0].status !== "pending") {
      return { success: false, message: "Este desafío ya no está pendiente" };
    }

    const userTeamIds = await getUserTeamIds(userId);
    if (!userTeamIds.includes(matchData[0].defenderTeamId)) {
      return {
        success: false,
        message: "No tienes permisos para rechazar este desafío",
      };
    }

    await db
      .update(match)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    revalidatePath("/mis-retas");
    return {
      success: true,
      message: "Desafío rechazado.",
    };
  } catch (error) {
    console.error("Error rejecting match:", error);
    return {
      success: false,
      message: "Error al rechazar el desafío. Intenta de nuevo.",
    };
  }
}

export async function getAcceptedMatches(): Promise<
  AcceptedMatchWithDetails[]
> {
  try {
    const acceptedMatches = await db
      .select({
        id: match.id,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        createdAt: match.createdAt,
        pyramidName: pyramid.name,
      })
      .from(match)
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .where(eq(match.status, "accepted"));

    const matchesWithDetails: AcceptedMatchWithDetails[] = await Promise.all(
      acceptedMatches.map(async (m) => {
        // Get team info and positions
        const [challengerTeam, defenderTeam, challengerPos, defenderPos] =
          await Promise.all([
            getTeamInfo(m.challengerTeamId),
            getTeamInfo(m.defenderTeamId),
            db
              .select({ row: position.row, col: position.col })
              .from(position)
              .where(
                and(
                  eq(position.teamId, m.challengerTeamId),
                  eq(position.pyramidId, m.pyramidId)
                )
              )
              .limit(1),
            db
              .select({ row: position.row, col: position.col })
              .from(position)
              .where(
                and(
                  eq(position.teamId, m.defenderTeamId),
                  eq(position.pyramidId, m.pyramidId)
                )
              )
              .limit(1),
          ]);

        if (
          !challengerTeam ||
          !defenderTeam ||
          !challengerPos.length ||
          !defenderPos.length
        ) {
          throw new Error(`Missing data for match ${m.id}`);
        }

        return {
          id: m.id,
          pyramidId: m.pyramidId,
          pyramidName: m.pyramidName || "Pirámide sin nombre",
          challengerTeam: {
            ...challengerTeam,
            currentRow: challengerPos[0].row,
            currentCol: challengerPos[0].col,
          },
          defenderTeam: {
            ...defenderTeam,
            currentRow: defenderPos[0].row,
            currentCol: defenderPos[0].col,
          },
          createdAt: m.createdAt!,
        };
      })
    );

    return matchesWithDetails;
  } catch (error) {
    console.error("Error fetching accepted matches:", error);
    return [];
  }
}

export async function completeMatch(
  matchId: number,
  winnerTeamId: number
): Promise<MatchCompletionResult> {
  try {
    const matchData = await db
      .select({
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        status: match.status,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) {
      return { success: false, message: "Match no encontrado" };
    }

    if (matchData[0].status !== "accepted") {
      return {
        success: false,
        message: "Solo se pueden completar matches aceptados",
      };
    }

    const { pyramidId, challengerTeamId, defenderTeamId } = matchData[0];
    const challengerWins = winnerTeamId === challengerTeamId;

    // Get current positions
    const [challengerPos, defenderPos] = await Promise.all([
      db
        .select({ row: position.row, col: position.col })
        .from(position)
        .where(
          and(
            eq(position.teamId, challengerTeamId),
            eq(position.pyramidId, pyramidId)
          )
        )
        .limit(1),
      db
        .select({ row: position.row, col: position.col })
        .from(position)
        .where(
          and(
            eq(position.teamId, defenderTeamId),
            eq(position.pyramidId, pyramidId)
          )
        )
        .limit(1),
    ]);

    if (!challengerPos.length || !defenderPos.length) {
      return {
        success: false,
        message: "No se encontraron las posiciones de los equipos",
      };
    }

    const challengerOldPos = challengerPos[0];
    const defenderOldPos = defenderPos[0];

    await db.transaction(async (tx) => {
      // Update match status
      await tx
        .update(match)
        .set({
          winnerTeamId,
          status: "played",
          updatedAt: new Date(),
        })
        .where(eq(match.id, matchId));

      // Update team stats and status
      if (challengerWins) {
        await tx
          .update(team)
          .set({
            wins:
              ((
                await tx
                  .select({ wins: team.wins })
                  .from(team)
                  .where(eq(team.id, challengerTeamId))
                  .limit(1)
              )[0].wins || 0) + 1,
            status: "winner",
            updatedAt: new Date(),
          })
          .where(eq(team.id, challengerTeamId));

        await tx
          .update(team)
          .set({
            losses:
              ((
                await tx
                  .select({ losses: team.losses })
                  .from(team)
                  .where(eq(team.id, defenderTeamId))
                  .limit(1)
              )[0].losses || 0) + 1,
            status: "looser",
            updatedAt: new Date(),
          })
          .where(eq(team.id, defenderTeamId));

        // Swap positions safely
        await tx
          .update(position)
          .set({ row: -1, col: -1 })
          .where(
            and(
              eq(position.teamId, challengerTeamId),
              eq(position.pyramidId, pyramidId)
            )
          );

        await tx
          .update(position)
          .set({
            row: challengerOldPos.row,
            col: challengerOldPos.col,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(position.teamId, defenderTeamId),
              eq(position.pyramidId, pyramidId)
            )
          );

        await tx
          .update(position)
          .set({
            row: defenderOldPos.row,
            col: defenderOldPos.col,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(position.teamId, challengerTeamId),
              eq(position.pyramidId, pyramidId)
            )
          );

        // Record position history
        await tx.insert(positionHistory).values({
          pyramidId,
          matchId,
          challengerTeamId,
          defenderTeamId,
          challengerOldRow: challengerOldPos.row,
          challengerOldCol: challengerOldPos.col,
          challengerNewRow: defenderOldPos.row,
          challengerNewCol: defenderOldPos.col,
          defenderOldRow: defenderOldPos.row,
          defenderOldCol: defenderOldPos.col,
          defenderNewRow: challengerOldPos.row,
          defenderNewCol: challengerOldPos.col,
        });
      } else {
        await tx
          .update(team)
          .set({
            wins:
              ((
                await tx
                  .select({ wins: team.wins })
                  .from(team)
                  .where(eq(team.id, defenderTeamId))
                  .limit(1)
              )[0].wins || 0) + 1,
            status: "winner",
            updatedAt: new Date(),
          })
          .where(eq(team.id, defenderTeamId));

        await tx
          .update(team)
          .set({
            losses:
              ((
                await tx
                  .select({ losses: team.losses })
                  .from(team)
                  .where(eq(team.id, challengerTeamId))
                  .limit(1)
              )[0].losses || 0) + 1,
            status: "looser",
            updatedAt: new Date(),
          })
          .where(eq(team.id, challengerTeamId));
      }
    });

    revalidatePath("/retas");

    return {
      success: true,
      message: challengerWins
        ? "Match completado. Las posiciones han sido intercambiadas."
        : "Match completado. Las posiciones permanecen iguales.",
    };
  } catch (error) {
    console.error("Error completing match:", error);
    return {
      success: false,
      message: "Error interno del servidor. Intenta de nuevo.",
    };
  }
}

export async function getUnresolvedMatchesForTeam(
  teamId: number
): Promise<UnresolvedMatch[]> {
  try {
    const rows = await db
      .select({
        id: match.id,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        status: match.status,
        createdAt: match.createdAt,
      })
      .from(match)
      .where(
        and(
          or(
            eq(match.challengerTeamId, teamId),
            eq(match.defenderTeamId, teamId)
          ),
          or(eq(match.status, "pending"), eq(match.status, "accepted"))
        )
      );

    return rows.map((r) => ({
      id: r.id,
      pyramidId: r.pyramidId,
      challengerTeamId: r.challengerTeamId,
      defenderTeamId: r.defenderTeamId,
      status: r.status as "pending" | "accepted",
      createdAt: r.createdAt!,
    }));
  } catch (error) {
    console.error("Error fetching unresolved matches for team:", error);
    return [];
  }
}
