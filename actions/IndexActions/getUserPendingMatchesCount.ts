"use server";
import { db } from "@/lib/drizzle";
import { eq, and, count } from "drizzle-orm";
import { match } from "@/db/schema";

import { getUserTeamId } from "@/actions/IndexActions/getUserTeamId";

export async function getUserPendingMatchesCount(userId: string) {
  try {
    const userTeamId = await getUserTeamId(userId);

    if ("error" in userTeamId) {
      throw new Error(
        "Error al conseguir id del equipo buscando matches pendientes"
      );
    }

    if (!userTeamId.teamId) {
      throw new Error("No hay equipo");
    }

    const pendingMatchesCount = await db
      .select({ count: count() })
      .from(match)
      .where(
        and(
          eq(match.defenderTeamId, userTeamId.teamId),
          eq(match.status, "pending")
        )
      );

    return pendingMatchesCount[0].count;
  } catch (error) {
    console.error(
      "Error al conseguir las partidas pendientes de respuesta:",
      error
    );
    return null;
  }
}
