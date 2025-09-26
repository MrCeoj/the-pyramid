"use server";
import { db } from "@/lib/drizzle";
import { eq, and } from "drizzle-orm";
import { match, team, position, positionHistory } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { MatchCompletionResult } from "@/actions/matches/types";

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
          teamId: challengerTeamId,
          affectedTeamId: defenderTeamId,
          oldRow: challengerOldPos.row,
          oldCol: challengerOldPos.col,
          newRow: defenderOldPos.row,
          newCol: defenderOldPos.col,
          affectedOldRow: defenderOldPos.row,
          affectedOldCol: defenderOldPos.col,
          affectedNewRow: challengerOldPos.row,
          affectedNewCol: challengerOldPos.col,
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
