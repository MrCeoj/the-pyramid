"use server";
import { eq, and, or, gte, sql } from "drizzle-orm";
import { team, match } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { getPreviousMonday } from "@/actions/TeamsActions";

export default async function getRejectedAmount(teamId: number) {
  try {
    const prevMonday = await getPreviousMonday();
    const currMonday = await getPreviousMonday(false);

    const [prevWeekMatchesCount] = await db
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
          gte(match.updatedAt, prevMonday),
          eq(match.status, "played")
        )
      );

    let matchesPlayed = prevWeekMatchesCount.count ?? 0;

    if (matchesPlayed >= 2) {
      return 0;
    }

    const [currWeekMatchesCount] = await db
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
          gte(match.updatedAt, currMonday),
          eq(match.status, "played")
        )
      );

    matchesPlayed = currWeekMatchesCount.count ?? 0;

    if (matchesPlayed >= 1) {
      return 0;
    }

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
