"use server";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { match } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { sendAcceptMail } from "@/actions/MailActions";
import { MatchResult } from "@/actions/matches/types";
import {
  getTeamWithPlayers,
  getUserTeamIds,
} from "@/actions/matches/TeamService";

export async function acceptMatch(
  matchId: number,
  userId: string
): Promise<MatchResult> {
  try {
    // Wrap the entire logic in a transaction
    return await db.transaction(async (tx) => {
      // 1. Get all necessary match info at once
      const matchArr = await tx
        .select({
          status: match.status,
          defenderTeamId: match.defenderTeamId,
          attackerTeamId: match.challengerTeamId,
          pyramidId: match.pyramidId,
        })
        .from(match)
        .where(eq(match.id, matchId))
        .limit(1);

      if (!matchArr.length) {
        return { success: false, message: "Desafío no encontrado" };
      }

      const currentMatch = matchArr[0];

      if (currentMatch.status !== "pending") {
        return { success: false, message: "Este desafío ya no está pendiente" };
      }

      // 2. Verify user permissions
      const userTeamIds = await getUserTeamIds(userId); // Pass transaction client `tx` if needed
      if (!userTeamIds.includes(currentMatch.defenderTeamId)) {
        return {
          success: false,
          message: "No tienes permisos para aceptar este desafío",
        };
      }

      // 3. Update the match status
      await tx
        .update(match)
        .set({
          status: "accepted",
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

      await sendAcceptMail(attacker, defender, currentMatch.pyramidId);

      revalidatePath("/mis-retas");

      return {
        success: true,
        message: "Desafío aceptado. ¡Prepárate para el combate!",
      };
    });
  } catch (error) {
    console.error("Error accepting match:", error);
    return {
      success: false,
      message: "Error al aceptar el desafío. Intenta de nuevo.",
    };
  }
}
