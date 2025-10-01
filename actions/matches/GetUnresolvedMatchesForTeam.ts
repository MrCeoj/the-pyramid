"use server";
import { db } from "@/lib/drizzle";
import { eq, or, and } from "drizzle-orm";
import { match } from "@/db/schema";
import { UnresolvedMatch } from "@/actions/matches/types";

export async function getUnresolvedMatchesForTeam(
  teamId: number
): Promise<UnresolvedMatch[]> {
  try {
    const rows = await db
      .select({
        id: match.id,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        status: match.status,
        createdAt: match.createdAt,
      })
      .from(match)
      .where(
        
        and(
          or(
            eq(match.challengerTeamId, teamId),
            eq(match.defenderTeamId, teamId)
          ),
          or(eq(match.status, "pending"), eq(match.status, "accepted"))
        )
      );

    return rows.map((r) => ({
      id: r.id,
      pyramidId: r.pyramidId,
      challengerTeamId: r.challengerTeamId,
      defenderTeamId: r.defenderTeamId,
      status: r.status as "pending" | "accepted",
      createdAt: r.createdAt!,
    }));
  } catch (error) {
    console.error("Error fetching unresolved matches for team:", error);
    return [];
  }
}
