"use server";
import { eq } from "drizzle-orm";
import { match } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { revalidatePath } from "next/cache";
import { MatchResult } from "@/actions/matches/types";
import { sendRejectMail } from "@/actions/MailActions";
import {
  getTeamWithPlayers,
  getUserTeamIds,
} from "@/actions/matches/TeamService";

export async function rejectMatch(matchId: number, userId: string): Promise<MatchResult> {
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

    const [attacker, defender] = await Promise.all([
      getTeamWithPlayers(matchData.attackerTeamId),
      getTeamWithPlayers(matchData.defenderTeamId),
    ]);

    if (!attacker || !defender) {
      console.error("Could not fetch full team data for notification.", {
        matchId,
      });
    }

    await db
      .update(match)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(match.id, matchId));

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
