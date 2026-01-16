"use server";
import { team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Updates a team's players.
 */
export async function updateTeamPlayers(
  teamId: number,
  data: { player1Id?: string | null; player2Id?: string | null },
) {
  // Validate that if both players are provided, they are different
  if (data.player1Id && data.player2Id && data.player1Id === data.player2Id) {
    throw new Error("Los jugadores no pueden ser la misma persona.");
  }

  // Validate that at least one player is provided or explicitly set to null
  if (data.player1Id === "" && data.player2Id === "") {
    throw new Error("Un equipo debe tener al menos un jugador.");
  }

  try {
    const updateData: {
      player1Id?: string | null;
      player2Id?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.player1Id !== undefined) {
      updateData.player1Id = data.player1Id || null;
    }

    if (data.player2Id !== undefined) {
      updateData.player2Id = data.player2Id || null;
    }

    const updatedTeam = await db
      .update(team)
      .set(updateData)
      .where(eq(team.id, teamId))
      .returning();

    revalidatePath("/equipos");
    return updatedTeam[0];
  } catch (error) {
    console.error("Failed to update team players:", error);
    if (
      error instanceof Error &&
      error.message.includes("unique_team_players")
    ) {
      throw new Error("Ya existe un equipo con estos jugadores.");
    }
    throw new Error("No se pudieron actualizar los jugadores del equipo.");
  }
}
