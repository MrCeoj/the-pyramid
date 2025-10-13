"use server";
import { db } from "@/lib/drizzle";
import { revalidatePath } from "next/cache";
import { MatchCompletionResult } from "@/actions/matches/types";
import {
  getMatchData,
  getPositions,
  updateTeamsAfterMatch,
  updateMatchStatus,
  swapPositionsIfNeeded,
  evaluateMatchesAfterResult,
} from "./helpers";

export async function completeMatch(
  matchId: number,
  winnerTeamId: number
): Promise<MatchCompletionResult> {
  try {
    const matchData = await getMatchData(matchId);
    if (!matchData) return { success: false, message: "Match no encontrado" };

    if (matchData.status !== "accepted") {
      return {
        success: false,
        message: "Solo se pueden completar matches aceptados",
      };
    }

    const { pyramidId, challengerTeamId, defenderTeamId } = matchData;
    const loserTeamId =
      winnerTeamId === challengerTeamId ? defenderTeamId : challengerTeamId;

    const positions = await getPositions(pyramidId, [
      challengerTeamId,
      defenderTeamId,
    ]);
    const winnerCurrentPos = positions.find(
      (p: { teamId: number }) => p.teamId === winnerTeamId
    );
    const loserCurrentPos = positions.find(
      (p: { teamId: number }) => p.teamId === loserTeamId
    );

    if (!winnerCurrentPos || !loserCurrentPos)
      return {
        success: false,
        message: "No se encontraron las posiciones de los equipos",
      };

    const shouldSwapPositions =
      winnerCurrentPos.row > loserCurrentPos.row ||
      (winnerCurrentPos.row === loserCurrentPos.row &&
        winnerCurrentPos.col >= loserCurrentPos.col);

    await db.transaction(async (tx) => {
      await updateMatchStatus(tx, matchId, winnerTeamId);

      await updateTeamsAfterMatch(tx, winnerTeamId, loserTeamId);

      await evaluateMatchesAfterResult(
        tx,
        pyramidId,
        winnerTeamId,
        loserTeamId
      );

      if (shouldSwapPositions)
        await swapPositionsIfNeeded(
          tx,
          { pyramidId, matchId },
          { winnerTeamId, loserTeamId },
          { winnerCurrentPos, loserCurrentPos }
        );

      await evaluateMatchesAfterResult(
        tx,
        pyramidId,
        winnerTeamId,
        loserTeamId
      );
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
