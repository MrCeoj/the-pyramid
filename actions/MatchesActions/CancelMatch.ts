"use server";
import { db } from "@/lib/drizzle";
import { eq, inArray } from "drizzle-orm";
import { match, team } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { sendCancelMail } from "@/actions/MailActions";
import { getTeamWithPlayers } from "@/actions/MatchesActions/TeamService";

export async function cancelMatch(matchId: number): Promise<MatchResult> {
  try {
    // Wrap the entire logic in a transaction
    return await db.transaction(async (tx) => {
      // 1. Get all necessary match info at once
      const [currentMatch] = await tx
        .select({
          status: match.status,
          defenderTeamId: match.defenderTeamId,
          attackerTeamId: match.challengerTeamId,
          pyramidId: match.pyramidId,
        })
        .from(match)
        .where(eq(match.id, matchId))
        .limit(1);

      if (!currentMatch) {
        return { success: false, message: "Desafío no encontrado" };
      }

      const involvedTeams = [
        currentMatch.attackerTeamId,
        currentMatch.defenderTeamId,
      ];

      await tx
        .update(team)
        .set({ defendable: false })
        .where(inArray(team.id, involvedTeams));

      await tx
        .update(match)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(match.id, matchId));

      const [attacker, defender] = await Promise.all([
        getTeamWithPlayers(currentMatch.attackerTeamId),
        getTeamWithPlayers(currentMatch.defenderTeamId),
      ]);

      if (!attacker || !defender) {
        throw new Error(
          "No se pudieron obtener los datos completos de los equipos."
        );
      }

      await sendCancelMail(attacker, defender, currentMatch.pyramidId);

      revalidatePath("/mis-retas");
      revalidatePath("/retas");
      revalidatePath("/")

      return {
        success: true,
        message: "Desafío aceptado. ¡Prepárate para el combate!",
      };
    });
  } catch (error) {
    console.error("Error cancelling match:", error);
    return {
      success: false,
      message: "Error al cancelar el desafío. Intenta de nuevo.",
    };
  }
}
