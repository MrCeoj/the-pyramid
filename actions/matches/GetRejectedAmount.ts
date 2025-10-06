"use server";
import { eq, and, or, gte, sql } from "drizzle-orm";
import { team, match } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { getPreviousMonday } from "@/actions/TeamsActions";

export default async function getRejectedAmount(teamId: number) {
  try {
    const monday = await getPreviousMonday();

    // 1️⃣ Count how many matches this team played since Monday
    const playedMatchesCount = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(match)
      .where(
        and(
          or(
            eq(match.challengerTeamId, teamId),
            eq(match.defenderTeamId, teamId)
          ),
          gte(match.updatedAt, monday),
          eq(match.status, "played")
        )
      );

    const matchesPlayed = playedMatchesCount[0]?.count ?? 0;

    // 2️⃣ If the team has played at least 2 matches, reset rejection count
    if (matchesPlayed >= 2) {
      return 0;
    }

    // 3️⃣ Otherwise, fetch their current rejection amount
    const teamData = await db
      .select({ rejected: team.amountRejected })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (!teamData.length) {
      throw new Error(`Team with ID ${teamId} not found.`);
    }

    return teamData[0].rejected ?? 0;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return { error: error.message };
    }
  }

}
