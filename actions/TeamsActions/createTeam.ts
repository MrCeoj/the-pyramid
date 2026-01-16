"use server"
import { team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { revalidatePath } from "next/cache";

/**
 * Creates a new team with two specified players.
 */
export async function createTeam(data: {
  player1Id: string;
  player2Id: string;
  categoryId: number;
}) {
  if (data.player1Id === data.player2Id) {
    throw new Error("Un equipo debe tener dos miembros distintos.");
  }

  try {
    const newTeam = await db
      .insert(team)
      .values({
        player1Id: data.player1Id || null,
        player2Id: data.player2Id || null,
        categoryId: data.categoryId,
        status: "idle",
      })
      .returning();

    revalidatePath("/equipos");
    return newTeam[0];
  } catch (error) {
    console.error("Failed to create team:", error);
    if (error instanceof Error)
      if (error.message.includes("unique_team_players")) {
        throw new Error("A team with these two players already exists.");
      }
    throw new Error("No se pudo crear el equipo.");
  }
}