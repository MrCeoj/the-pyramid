"use server"
import { db } from "@/lib/drizzle";
import { team } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

/**
 * Updates a team's category or status.
 */
export async function updateTeam(
  teamId: number,
  data: {
    categoryId?: number;
    status?: "looser" | "winner" | "idle" | "risky";
    lastResult?: "up" | "down" | "stayed" | "none";
    defendable?: boolean;
    loosingStreak?: number;
  },
) {
  try {
    const updatedTeam = await db
      .update(team)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(team.id, teamId))
      .returning();

    revalidatePath("/equipos");
    return updatedTeam[0];
  } catch (error) {
    console.error("Failed to update team:", error);
    throw new Error("Could not update the team.");
  }
}
