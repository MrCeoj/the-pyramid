"use server";

import { matchScores } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export default async function getMatchScore(matchId: number) {
  try {
    const [matchScore] = await db
      .select()
      .from(matchScores)
      .where(eq(matchScores.matchId, matchId))
      .limit(1) as MatchScore[];
    if (!matchScore) return null;
    return matchScore;
  } catch (error) {return null}
}
