"use server";
import { match, matchScores } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export default async function acceptScore(
  matchId: number,
  teamId: number,
  accepted: boolean
) {
  try {
    return await db.transaction(async (tx) => {
      const [currentMatch] = await tx
        .select()
        .from(matchScores)
        .where(eq(matchScores.matchId, matchId))
        .limit(1);

      if (!currentMatch) {
        return { error: "Match not found" };
      }

      const isDefender = teamId === currentMatch.defenderTeamId;
      const isAttacker = teamId === currentMatch.attackerTeamId;

      if (!isDefender && !isAttacker) {
        return { error: "Team not part of this match" };
      }

      const updatedAgreement = {
        defenderTeamAgreed: isDefender ? accepted : currentMatch.defenderTeamAgreed,
        attackerTeamAgreed: isAttacker ? accepted : currentMatch.attackerTeamAgreed,
      };

      await tx
        .update(matchScores)
        .set({
          ...updatedAgreement,
          updatedAt: new Date(),
        })
        .where(eq(matchScores.matchId, matchId));

      // Check if both teams have now agreed
      const bothAgreed = updatedAgreement.defenderTeamAgreed && updatedAgreement.attackerTeamAgreed;

      if (bothAgreed){
        await tx.update(match).set({status: "scored"}).where(eq(match.id, matchId))
      }

      return { 
        success: true, 
        bothAgreed,
        ...(bothAgreed && { message: "Scores finalized - both teams agreed!" })
      };
    });
  } catch (error) {
    console.error("Error accepting score:", error);
    return { error: "Failed to accept score" };
  }
}