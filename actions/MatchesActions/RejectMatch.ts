"use server";
import { eq, and, or, gte, sql } from "drizzle-orm";
import { match, team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { revalidatePath } from "next/cache";
import { sendRejectMail } from "@/actions/MailActions";
import { getPreviousMonday } from "@/lib/utils";
import {
  getTeamWithPlayers,
  getUserTeamIds,
} from "@/actions/MatchesActions/TeamService";
import getRejectedAmount from "./GetRejectedAmount";

export async function rejectMatch(
  matchId: number,
  userId: string
): Promise<MatchResult> {
  try {
    const matchArr = await db
      .select({
        defenderTeamId: match.defenderTeamId,
        attackerTeamId: match.challengerTeamId,
        status: match.status,
        pyramidId: match.pyramidId,
      })
      .from(match)
      .where(eq(match.id, matchId))
      .limit(1);

    if (!matchArr.length) {
      return { success: false, message: "Desafío no encontrado" };
    }

    const matchData = matchArr[0];

    if (matchData.status !== "pending") {
      return { success: false, message: "Este desafío ya no está pendiente" };
    }

    const userTeamIds = await getUserTeamIds(userId);
    if (!userTeamIds.includes(matchData.defenderTeamId)) {
      return {
        success: false,
        message: "No tienes permisos para rechazar este desafío",
      };
    }

    // Get Monday of current week
    const monday = await getPreviousMonday();

    const matchCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(match)
      .where(
        and(
          or(
            eq(match.defenderTeamId, matchData.defenderTeamId),
            eq(match.challengerTeamId, matchData.defenderTeamId)
          ),
          gte(match.updatedAt, monday),
          eq(match.status, "played")
        )
      );

    const playedMatchesThisWeek = matchCountResult[0]?.count ?? 0;

    let rejectedMatches = 0;

    // Only check rejected count if no match played this week
    if (playedMatchesThisWeek < 2) {
      const amount = await getRejectedAmount(matchData.defenderTeamId);

      if (amount === null || amount === undefined)
        throw new Error(
          "Error al conseguir cantidad de partidas rechazadas. Null"
        );
      if (typeof amount !== "number")
        throw new Error(
          "Error al conseguir cantidad de partidas rechazadas. Error"
        );

      rejectedMatches = amount;

      if (rejectedMatches >= 2)
        return {
          success: false,
          message: "Ya has rechazado 2 retas, debes aceptar la siguiente",
        };
    }

    const [attacker, defender] = await Promise.all([
      getTeamWithPlayers(matchData.attackerTeamId),
      getTeamWithPlayers(matchData.defenderTeamId),
    ]);

    if (!attacker || !defender) {
      console.error("Could not fetch full team data for notification.", {
        matchId,
      });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(match)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(match.id, matchId));

      await tx
        .update(team)
        .set({
          amountRejected: playedMatchesThisWeek >= 2 ? 0 : rejectedMatches + 1,
        })
        .where(eq(team.id, matchData.defenderTeamId));
    });

    if (attacker && defender && playedMatchesThisWeek < 2) {
      await sendRejectMail(attacker, defender, matchData.pyramidId);
    }

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
