"use server";
import { eq, and, or, gte } from "drizzle-orm";
import { team, match } from "@/db/schema";
import { db } from "@/lib/drizzle";

export default async function getRejectedAmount(teamId: number) {
  try {
    const monday = getMonday();

    // 2. Check if the team has played any match since Monday
    const playedMatchThisWeek = await db
      .select({ id: match.id })
      .from(match)
      .where(
        and(
          // The team was either the challenger OR the defender
          or(
            eq(match.challengerTeamId, teamId),
            eq(match.defenderTeamId, teamId)
          ),
          gte(match.updatedAt, monday),
          eq(match.status, "played")
        )
      )
      .limit(1);

    // 3. If a played match was found, the rejection count is effectively 0
    if (playedMatchThisWeek.length > 0) {
      console.log(playedMatchThisWeek)
      return 0;
    }

    // 4. If no match was played, get the stored rejection amount
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

function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setHours(0, 0, 0, 0);
  d.setDate(diff);
  return d;
}
