"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or } from "drizzle-orm";
import { team } from "@/db/schema";

export async function isUserInTeam(
  userId: string,
  teamId: number
): Promise<boolean> {
  try {
    const result = await db
      .select({ id: team.id })
      .from(team)
      .where(
        and(
          eq(team.id, teamId),
          or(eq(team.player1Id, userId), eq(team.player2Id, userId))
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking if user is in team:", error);
    return false;
  }
}