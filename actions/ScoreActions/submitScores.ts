"use server";
import { matchScores } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

type Scores = {
  defenderScore?: number[] | null;
  attackerScore?: number[] | null;
};

export default async function submitScores(
  score: number[],
  matchId: number,
  teamId: number,
) {
  try {
    await db.transaction(async (tx) => {
      const [currentMatch] = await tx
        .select()
        .from(matchScores)
        .where(eq(matchScores.matchId, matchId))
        .limit(1);

      if (!currentMatch) return { error: "Match not found" };

      if (score.length !== currentMatch.setsPlayed) {
        return { error: "Invalid number of sets" };
      }

      const isDefender = teamId === currentMatch.defenderTeamId;
      const isAttacker = teamId === currentMatch.attackerTeamId;

      if (!isDefender && !isAttacker) {
        return { error: "Team not part of this match" };
      }

      // Parse existing scores
      const currentScores = currentMatch.scores as Scores;

      // Prepare updated scores
      const updatedScores: Scores = {
        defenderScore: isDefender ? score : currentScores.defenderScore,
        attackerScore: isAttacker ? score : currentScores.attackerScore,
      };

      // Prepare updated agreement flags
      const updatedAgreement = {
        defenderTeamAgreed: isAttacker ? null : currentMatch.defenderTeamAgreed,
        attackerTeamAgreed: isDefender ? null : currentMatch.attackerTeamAgreed,
      };

      // Update the record
      await tx
        .update(matchScores)
        .set({
          scores: updatedScores,
          ...updatedAgreement,
          submittedByTeamId: teamId,
          updatedAt: new Date(),
        })
        .where(eq(matchScores.matchId, matchId));

      return { success: true };
    });
  } catch (error) {
    console.error("Error submitting scores:", error);
    return { error: "Failed to submit scores" };
  }
}