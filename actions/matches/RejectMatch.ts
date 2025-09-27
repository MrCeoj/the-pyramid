"use server";
import { eq, and, gte } from "drizzle-orm";
import { match, team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { revalidatePath } from "next/cache";
import { MatchResult } from "@/actions/matches/types";
import { sendRejectMail } from "@/actions/MailActions";
import {
  getTeamWithPlayers,
  getUserTeamIds,
} from "@/actions/matches/TeamService";
import getRejectedAmount from "./GetRejectedAmount";

// Helper to get Monday of the current week
function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Calculate Monday's date

  d.setHours(0, 0, 0, 0);
  d.setDate(diff);
  return d;
}


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
    const monday = getMonday();

    // Check if the team has played any match in this week
    const playedThisWeek = await db
      .select({ id: match.id })
      .from(match)
      .where(
        and(
          eq(match.defenderTeamId, matchData.defenderTeamId),
          gte(match.updatedAt, monday),
          eq(match.status, "played")
        )
      )
      .limit(1);

    let rejectedMatches = 0;

    // Only check rejected count if no match played this week
    if (!playedThisWeek.length) {
      const amount = await getRejectedAmount(matchData.defenderTeamId);

      if (amount === null || amount === undefined) throw new Error("Error al conseguir cantidad de partidas rechazadas. Null")
      if (typeof amount !== "number") throw new Error("Error al conseguir cantidad de partidas rechazadas. Error")

      rejectedMatches = amount

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
          amountRejected: playedThisWeek.length ? 0 : rejectedMatches + 1,
        })
        .where(eq(team.id, matchData.defenderTeamId));
    });

    if (attacker && defender) {
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
