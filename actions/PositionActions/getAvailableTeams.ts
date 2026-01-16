"use server"
import { position } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { getApplicableTeams } from "@/actions/PositionActions/getApplicableTeams";

export async function getAvailableTeams(
  pyramidId: number,
): Promise<TeamWithPlayers[]> {
  try {
    // Get all applicable teams
    const applicableTeams = await getApplicableTeams(pyramidId);

    // Get teams that are already positioned in this pyramid
    const positionedTeams = await db
      .select({ teamId: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    const positionedTeamIds = positionedTeams.map((p) => p.teamId);

    // Filter out teams that are already positioned
    const availableTeams = applicableTeams.filter(
      (team) => !positionedTeamIds.includes(team.id),
    );

    return availableTeams;
  } catch (error) {
    console.error("Error fetching available teams:", error);
    return [];
  }
}
