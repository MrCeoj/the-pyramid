"use server";
import { getUserTeamIds } from "./getUserTeamIds";

export async function getUserTeamId(
  userId: string
): Promise<{ teamId: number | null } | { error: string }> {
  try {
    const result = await getUserTeamIds(userId);

    if ("error" in result) {
      return result;
    }

    return { teamId: result.teamIds.length > 0 ? result.teamIds[0] : null };
  } catch (error) {
    if (error instanceof Error)
      console.error("Error fetching user team for userId:", userId);
    return { error: "Internal server error" };
  }
}
