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
} from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createMatch({
  pyramidId,
  challengerTeamId,
  defenderTeamId,
}: {
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
}) {
  try {
    const [newMatch] = await db
      .insert(match)
      .values({
        pyramidId,
        challengerTeamId,
        defenderTeamId,
        status: "pending",
      })
      .returning();

    return { success: true, match: newMatch };
  } catch (err) {
    console.error("Error creating match:", err);
    return { success: false, error: "No se pudo establecer la reta" };
  }
}

export type UnresolvedMatch = {
  id: number;
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  status: "pending" | "accepted";
  createdAt: Date;
};


export type MatchWithDetails = {
  id: number;
  status: "pending" | "accepted" | "played" | "rejected" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: {
    id: number;
    name: string;
    categoryId: number | null;
  };
  defenderTeam: {
    id: number;
    name: string;
    categoryId: number | null;
  };
  winnerTeam?: {
    id: number;
    name: string;
  } | null;
  evidenceUrl?: string | null;
};

export type MatchResult = {
  success: boolean;
  message: string;
};

export type Profile = {
  id: number;
  userId: string;
  nickname: string | null;
  teamId: number | null;
};
export async function getUserMatches(userId: string): Promise<{
  pendingMatches: MatchWithDetails[];
  matchHistory: MatchWithDetails[];
}> {
  try {
    console.log(userId);
    // Get user's team ID
    const userProfile = await db
      .select({ teamId: profile.teamId })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    console.log(userProfile);

    if (!userProfile.length || !userProfile[0].teamId) {
      console.log("No perfil o no equipo");
      return { pendingMatches: [], matchHistory: [] };
    }

    const teamId = userProfile[0].teamId;

    // Get all matches where user's team is involved
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
        challengerName: team.name,
        challengerCategory: team.categoryId,
        defenderName: team.name,
        defenderCategory: team.categoryId,
      })
      .from(match)
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .innerJoin(team, eq(match.challengerTeamId, team.id))
      .where(
        or(eq(match.challengerTeamId, teamId), eq(match.defenderTeamId, teamId))
      )
      .orderBy(desc(match.createdAt));

    // We need to get defender team info separately due to join limitations
    const matchesWithDetails: MatchWithDetails[] = await Promise.all(
      matches.map(async (m) => {
        // Get challenger team details
        const challengerTeam = await db
          .select({
            id: team.id,
            name: team.name,
            categoryId: team.categoryId,
          })
          .from(team)
          .where(eq(team.id, m.challengerTeamId))
          .limit(1);

        // Get defender team details
        const defenderTeam = await db
          .select({
            id: team.id,
            name: team.name,
            categoryId: team.categoryId,
          })
          .from(team)
          .where(eq(team.id, m.defenderTeamId))
          .limit(1);

        // Get winner team details if exists
        let winnerTeam = null;
        if (m.winnerTeamId) {
          const winner = await db
            .select({
              id: team.id,
              name: team.name,
            })
            .from(team)
            .where(eq(team.id, m.winnerTeamId))
            .limit(1);

          if (winner.length) {
            winnerTeam = winner[0];
          }
        }

        return {
          id: m.id,
          status: m.status,
          createdAt: m.createdAt!,
          updatedAt: m.updatedAt!,
          pyramidId: m.pyramidId,
          pyramidName: m.pyramidName || "Pirámide sin nombre",
          challengerTeam: {
            id: challengerTeam[0]?.id || 0,
            name: challengerTeam[0]?.name || "Equipo sin nombre",
            categoryId: challengerTeam[0]?.categoryId || null,
          },
          defenderTeam: {
            id: defenderTeam[0]?.id || 0,
            name: defenderTeam[0]?.name || "Equipo sin nombre1",
            categoryId: defenderTeam[0]?.categoryId || null,
          },
          winnerTeam,
          evidenceUrl: m.evidenceUrl,
        };
      })
    );

    // Separate pending matches (where user is defender) from history
    const pendingMatches = matchesWithDetails.filter(
      (m) => m.status === "pending" && m.defenderTeam.id === teamId
    );

    const matchHistory = matchesWithDetails;

    return { pendingMatches, matchHistory };
  } catch (error) {
    console.error("Error fetching user matches:", error);
    return { pendingMatches: [], matchHistory: [] };
  }
}

export async function acceptMatch(matchId: number): Promise<MatchResult> {
  try {
    await db
      .update(match)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    revalidatePath("/matches");
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

export async function rejectMatch(matchId: number): Promise<MatchResult> {
  try {
    await db
      .update(match)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

    revalidatePath("/matches");
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

export type AcceptedMatchWithDetails = {
  id: number;
  pyramidId: number;
  pyramidName: string;
  challengerTeam: {
    id: number;
    name: string;
    categoryId: number | null;
    wins: number;
    losses: number;
    currentRow: number;
    currentCol: number;
    players: Profile[];
  };
  defenderTeam: {
    id: number;
    name: string;
    categoryId: number | null;
    wins: number;
    losses: number;
    currentRow: number;
    currentCol: number;
  };
  createdAt: Date;
};

export type MatchCompletionResult = {
  success: boolean;
  message: string;
};

export async function getAcceptedMatches(): Promise<
  AcceptedMatchWithDetails[]
> {
  try {
    // Get all accepted matches
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

    // Get detailed info for each match
    const matchesWithDetails: AcceptedMatchWithDetails[] = await Promise.all(
      acceptedMatches.map(async (m) => {
        // Get challenger team and position info
        const challengerData = await db
          .select({
            id: team.id,
            name: team.name,
            categoryId: team.categoryId,
            wins: team.wins,
            losses: team.losses,
            row: position.row,
            col: position.col,
          })
          .from(team)
          .innerJoin(position, eq(team.id, position.teamId))
          .where(
            and(
              eq(team.id, m.challengerTeamId),
              eq(position.pyramidId, m.pyramidId)
            )
          )
          .limit(1);

        // Get defender team and position info
        const defenderData = await db
          .select({
            id: team.id,
            name: team.name,
            categoryId: team.categoryId,
            wins: team.wins,
            losses: team.losses,
            row: position.row,
            col: position.col,
          })
          .from(team)
          .innerJoin(position, eq(team.id, position.teamId))
          .where(
            and(
              eq(team.id, m.defenderTeamId),
              eq(position.pyramidId, m.pyramidId)
            )
          )
          .limit(1);

        return {
          id: m.id,
          pyramidId: m.pyramidId,
          pyramidName: m.pyramidName || "Pirámide sin nombre",
          challengerTeam: {
            id: challengerData[0]?.id || 0,
            name: challengerData[0]?.name || "Equipo desconocido",
            categoryId: challengerData[0]?.categoryId || null,
            wins: challengerData[0]?.wins || 0,
            losses: challengerData[0]?.losses || 0,
            currentRow: challengerData[0]?.row || 0,
            currentCol: challengerData[0]?.col || 0,
            players: await db
              .select({
                id: profile.id,
                userId: profile.userId,
                nickname: profile.nickname,
                teamId: profile.teamId,
              })
              .from(profile)
              .where(eq(profile.teamId, challengerData[0]?.id || 0)),
          },
          defenderTeam: {
            id: defenderData[0]?.id || 0,
            name: defenderData[0]?.name || "Equipo desconocido",
            categoryId: defenderData[0]?.categoryId || null,
            wins: defenderData[0]?.wins || 0,
            losses: defenderData[0]?.losses || 0,
            currentRow: defenderData[0]?.row || 0,
            currentCol: defenderData[0]?.col || 0,
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
    // Get match details first
    const matchData = await db
      .select({
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchData.length) {
      return {
        success: false,
        message: "Match no encontrado",
      };
    }

    const { pyramidId, challengerTeamId, defenderTeamId } = matchData[0];
    const attackerWins = winnerTeamId === challengerTeamId;

    // Get current positions before any changes
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

    // Start transaction for atomic operations
    await db.transaction(async (tx) => {
      // Update match with winner and status
      await tx
        .update(match)
        .set({
          winnerTeamId,
          status: "played",
          updatedAt: new Date(),
        })
        .where(eq(match.id, matchId));

      // Update team stats
      if (attackerWins) {
        // Challenger wins: increment challenger wins, increment defender losses
        await tx
          .update(team)
          .set({status: "winner",
            wins:
              challengerTeamId === winnerTeamId
                ? ((
                    await tx
                      .select({ wins: team.wins })
                      .from(team)
                      .where(eq(team.id, challengerTeamId))
                      .limit(1)
                  )[0].wins || 0) + 1
                : (
                    await tx
                      .select({ wins: team.wins })
                      .from(team)
                      .where(eq(team.id, challengerTeamId))
                      .limit(1)
                  )[0].wins,
          })
          .where(eq(team.id, challengerTeamId));

        await tx
          .update(team)
          .set({status: "looser",
            losses:
              ((
                await tx
                  .select({ losses: team.losses })
                  .from(team)
                  .where(eq(team.id, defenderTeamId))
                  .limit(1)
              )[0].losses || 0) + 1,
          })
          .where(eq(team.id, defenderTeamId));

        // Swap positions using temporary values to avoid constraint violations
        // Step 1: Move challenger to a temporary position
        await tx
          .update(position)
          .set({
            row: -1, // Temporary negative row to avoid conflicts
            col: -1,
          })
          .where(
            and(
              eq(position.teamId, challengerTeamId),
              eq(position.pyramidId, pyramidId)
            )
          );

        // Step 2: Move defender to challenger's old position
        await tx
          .update(position)
          .set({
            row: challengerOldPos.row,
            col: challengerOldPos.col,
          })
          .where(
            and(
              eq(position.teamId, defenderTeamId),
              eq(position.pyramidId, pyramidId)
            )
          );

        // Step 3: Move challenger to defender's old position
        await tx
          .update(position)
          .set({
            row: defenderOldPos.row,
            col: defenderOldPos.col,
          })
          .where(
            and(
              eq(position.teamId, challengerTeamId),
              eq(position.pyramidId, pyramidId)
            )
          );

        // Record position history (only when positions change)
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
        // Defender wins: increment defender wins, increment challenger losses
        await tx
          .update(team)
          .set({status: "winner",
            wins:
              ((
                await tx
                  .select({ wins: team.wins })
                  .from(team)
                  .where(eq(team.id, defenderTeamId))
                  .limit(1)
              )[0].wins || 0) + 1,
          })
          .where(eq(team.id, defenderTeamId));

        await tx
          .update(team)
          .set({
            status: "looser",
            losses:
              ((
                await tx
                  .select({ losses: team.losses })
                  .from(team)
                  .where(eq(team.id, challengerTeamId))
                  .limit(1)
              )[0].losses || 0) + 1,
          })
          .where(eq(team.id, challengerTeamId));

        // No position changes when defender wins
        // No position history entry needed
      }
    });

    revalidatePath("/admin/matches");
    revalidatePath("/pyramid");

    return {
      success: true,
      message: attackerWins
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
    // Matches where team is challenger OR defender and status is pending/accepted
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
          or(eq(match.challengerTeamId, teamId), eq(match.defenderTeamId, teamId)),
          or(eq(match.status, "pending"), eq(match.status, "accepted"))
        )
      )
    // Cast/normalize types if needed
    return rows.map((r) => ({
      id: r.id,
      pyramidId: r.pyramidId,
      challengerTeamId: r.challengerTeamId,
      defenderTeamId: r.defenderTeamId,
      status: r.status === "pending" ? "pending" : "accepted",
      createdAt: r.createdAt!,
    }));
  } catch (error) {
    console.error("Error fetching unresolved matches for team:", error);
    return [];
  }
}
