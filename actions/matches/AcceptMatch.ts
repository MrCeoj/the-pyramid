"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, inArray } from "drizzle-orm";
import { match, team } from "@/db/schema";
import { revalidatePath } from "next/cache";
import {
  sendAcceptMail,
  sendCancelledBecauseAcceptedMail,
} from "@/actions/MailActions";
import { MatchResult } from "@/actions/matches/types";
import {
  getBulkTeamsWithPlayers,
  getTeamWithPlayers,
  getUserTeamIds,
} from "@/actions/matches/TeamService";

export async function acceptMatch(
  matchId: number,
  userId: string
): Promise<MatchResult> {
  try {
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

      // Mark both teams as defendable
      await tx
        .update(team)
        .set({ defendable: true })
        .where(
          inArray(team.id, [
            currentMatch.defenderTeamId,
            currentMatch.attackerTeamId,
          ])
        );

      const affectedMatches = await tx
        .select({
          matchId: match.id,
          attacker: match.challengerTeamId,
          defender: match.defenderTeamId,
        })
        .from(match)
        .where(
          and(
            eq(match.status, "pending"),
            or(
              eq(match.defenderTeamId, currentMatch.defenderTeamId),
              eq(match.defenderTeamId, currentMatch.attackerTeamId),
              eq(match.challengerTeamId, currentMatch.defenderTeamId),
              eq(match.challengerTeamId, currentMatch.attackerTeamId)
            )
          )
        );

      const matchesIds = new Set<number>();

      // Build recipients list
      const teamsIds = new Set<number>();
      affectedMatches.forEach((m) => {
        matchesIds.add(m.matchId);
        teamsIds.add(m.attacker);
        teamsIds.add(m.defender);
      });

      teamsIds.delete(currentMatch.attackerTeamId);
      teamsIds.delete(currentMatch.defenderTeamId);

      const cancelledTeams = await getBulkTeamsWithPlayers(
        Array.from(teamsIds)
      );

      const validRecipients = cancelledTeams.filter(
        Boolean
      ) as TeamWithPlayers[];

      await tx
        .update(match)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(inArray(match.id, Array.from(matchesIds)));

      await tx
        .update(team)
        .set({ amountRejected: 0 })
        .where(eq(team.id, defender.id));

      await sendAcceptMail(attacker, defender, currentMatch.pyramidId);
      if (validRecipients.length > 0) {
        await sendCancelledBecauseAcceptedMail(
          validRecipients,
          attacker,
          defender,
          currentMatch.pyramidId
        );
      }

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
