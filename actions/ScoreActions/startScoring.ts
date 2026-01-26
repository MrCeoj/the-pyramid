"use server";
import { match, matchScores } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export default async function startScoringMatch(
  matchId: number,
  teamId: number,
  numberOfSets: number
) {
  try {
    const today = new Date();
    const today1hourlater = new Date(today.getDate() + 60 * 60 * 1000);
    await db.transaction(async (tx) => {
      const [scoringMatch] = await tx
        .update(match)
        .set({
          status: "scoring",
          scoringStartedAt: today,
          scoringDeadlineAt: today1hourlater,
        })
        .where(eq(match.id, matchId))
        .returning();

      await tx.insert(matchScores).values({
        matchId: matchId,
        defenderTeamId: scoringMatch.defenderTeamId,
        attackerTeamId: scoringMatch.challengerTeamId,
        setsPlayed: numberOfSets,
        scores: null,
        submittedByTeamId: teamId,
      });
    });
  } catch (error) {}
}
