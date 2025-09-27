"use server";
import { processExpiredMatches } from "@/actions/PositionActions";
import { db } from "@/lib/drizzle";
import { getTeamDisplayName, team } from "@/db/schema";

interface ExpiredMatchesResult {
  processedCount: number;
  swapsExecuted: number;
  affectedTeams: Array<{
    teamName: string;
    oldPosition: string;
    newPosition: string;
  }>;
}

export async function processExpiredMatchesAction(): Promise<ExpiredMatchesResult | null> {
  try {
    await processExpiredMatches();

    // You might want to modify your processExpiredMatches function to return
    // information about what was processed, or query the database here to get
    // recent position changes to show to the user
    
    // For now, returning a simple result - you can enhance this based on
    // what information you want to show in the modal
    
    // Query recent position changes (you might need to adjust this based on your schema)
    const recentChanges = await db
      .select({
        teamId: team.id,
        teamName: getTeamDisplayName,
        // Add other fields you need for the modal
      })
      .from(team)
      // Add appropriate where conditions to get recently affected teams
      .limit(10);

    // Build the result object
    const result: ExpiredMatchesResult = {
      processedCount: 0, // You'll need to get this from your function
      swapsExecuted: 0,  // You'll need to get this from your function
      affectedTeams: recentChanges.map(team => ({
        teamName: team.teamName,
        oldPosition: "Previous position", // Get from position history
        newPosition: "New position"       // Get from position history
      }))
    };

    return result;
  } catch (error) {
    console.error("Error in processExpiredMatchesAction:", error);
    return null;
  }
}