"use server"
import { team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Deletes a team.
 */
export async function deleteTeam(teamId: number) {
  try {
    await db.delete(team).where(eq(team.id, teamId));
    revalidatePath("/equipos");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    throw new Error("Could not delete the team.");
  }
}