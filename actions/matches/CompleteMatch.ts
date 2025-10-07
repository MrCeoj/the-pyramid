"use server";
import { db } from "@/lib/drizzle";
import { eq, and, inArray } from "drizzle-orm";
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
    const loserTeamId =
      winnerTeamId === challengerTeamId ? defenderTeamId : challengerTeamId;

    const positions = await db
      .select({
        teamId: position.teamId,
        row: position.row,
        col: position.col,
      })
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          inArray(position.teamId, [challengerTeamId, defenderTeamId])
        )
      );

    const winnerCurrentPos = positions.find((p) => p.teamId === winnerTeamId);
    const loserCurrentPos = positions.find((p) => p.teamId === loserTeamId);

    if (!winnerCurrentPos || !loserCurrentPos) {
      return {
        success: false,
        message: "No se encontraron las posiciones de los equipos",
      };
    }

    const shouldSwapPositions = (winnerCurrentPos.row > loserCurrentPos.row || winnerCurrentPos.col > loserCurrentPos.col);
    
    await db.transaction(async (tx) => {
      // 1. Update match status
      await tx
        .update(match)
        .set({
          winnerTeamId,
          status: "played",
          updatedAt: new Date(),
        })
        .where(eq(match.id, matchId));

      // 2. Reset flags for both teams now that the match is over
      await tx
        .update(team)
        .set({
          amountRejected: 0,
          defendable: false,
        })
        .where(inArray(team.id, [winnerTeamId, loserTeamId]));

      // 3. Update wins for the winner
      const currentWins = (await tx.select({ wins: team.wins }).from(team).where(eq(team.id, winnerTeamId)).limit(1))[0].wins || 0;
      await tx
        .update(team)
        .set({
          wins: currentWins + 1,
          status: "winner",
          updatedAt: new Date(),
        })
        .where(eq(team.id, winnerTeamId));

      // 4. Update losses for the loser
      const currentLosses = (await tx.select({ losses: team.losses }).from(team).where(eq(team.id, loserTeamId)).limit(1))[0].losses || 0;
      await tx
        .update(team)
        .set({
          losses: currentLosses + 1,
          status: "looser",
          updatedAt: new Date(),
        })
        .where(eq(team.id, loserTeamId));

      // 5. If the winner was lower-ranked, swap their positions
      if (shouldSwapPositions) {
        // A -> temp, B -> A, temp -> B swap to avoid unique constraint conflicts
        await tx
          .update(position)
          .set({ row: -1, col: -1 })
          .where(and(eq(position.teamId, winnerTeamId), eq(position.pyramidId, pyramidId)));

        await tx
          .update(position)
          .set({
            row: winnerCurrentPos.row,
            col: winnerCurrentPos.col,
            updatedAt: new Date(),
          })
          .where(and(eq(position.teamId, loserTeamId), eq(position.pyramidId, pyramidId)));

        await tx
          .update(position)
          .set({
            row: loserCurrentPos.row,
            col: loserCurrentPos.col,
            updatedAt: new Date(),
          })
          .where(and(eq(position.teamId, winnerTeamId), eq(position.pyramidId, pyramidId)));

        // Log the position change
        await tx.insert(positionHistory).values({
          pyramidId,
          matchId,
          teamId: winnerTeamId,
          affectedTeamId: loserTeamId,
          oldRow: winnerCurrentPos.row,
          oldCol: winnerCurrentPos.col,
          newRow: loserCurrentPos.row,
          newCol: loserCurrentPos.col,
          affectedOldRow: loserCurrentPos.row,
          affectedOldCol: loserCurrentPos.col,
          affectedNewRow: winnerCurrentPos.row,
          affectedNewCol: winnerCurrentPos.col,
        });
      }
    });

    revalidatePath("/retas");

    return {
      success: true,
      message: shouldSwapPositions
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