"use server";
import { db } from "@/lib/drizzle";
import { eq, or } from "drizzle-orm";
import { team } from "@/db/schema";

export async function getUserTeamIds(
  userId: string
): Promise<{ teamIds: number[] } | { error: string }> {
  try {
    if (!userId) {
      return { error: "User ID is required" };
    }

    // Get all teams where user is either player1 or player2
    const userTeams = await db
      .select({
        id: team.id,
      })
      .from(team)
      .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

    return { teamIds: userTeams.map((t) => t.id) };
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return { error: "Internal server error" };
  }
}
