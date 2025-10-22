"use server";
import { db } from "@/lib/drizzle";
import { eq, or, desc } from "drizzle-orm";
import { match, pyramid } from "@/db/schema";
import { TeamWithPlayers } from "@/actions/PositionActions";
import { MatchWithDetails } from "@/actions/matches/types";
import { getTeamWithPlayers, getUserTeamIds } from "@/actions/matches/TeamService";

export async function getUserMatches(userId: string): Promise<{
  pendingMatches: MatchWithDetails[];
  matchHistory: MatchWithDetails[];
}> {
  try {
    // Get all teams user belongs to
    const userTeamIds = await getUserTeamIds(userId);

    if (userTeamIds.length === 0) {
      return { pendingMatches: [], matchHistory: [] };
    }

    // Get all matches where user's teams are involved
    const matches = await db
      .select({
        id: match.id,
        status: match.status,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        pyramidId: match.pyramidId,
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
        winnerTeamId: match.winnerTeamId,
        evidenceUrl: match.evidenceUrl,
        pyramidName: pyramid.name,
      })
      .from(match)
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .where(
        or(
          ...userTeamIds.map((teamId) =>
            or(
              eq(match.challengerTeamId, teamId),
              eq(match.defenderTeamId, teamId)
            )
          )
        )
      )
      .orderBy(desc(match.updatedAt));

    // Get team info for all involved teams
    const teamIds = new Set<number>();
    matches.forEach((m) => {
      teamIds.add(m.challengerTeamId);
      teamIds.add(m.defenderTeamId);
      if (m.winnerTeamId) teamIds.add(m.winnerTeamId);
    });

    const teamInfoMap = new Map<number, TeamWithPlayers>();
    await Promise.all(
      Array.from(teamIds).map(async (teamId) => {
        const teamInfo = await getTeamWithPlayers(teamId);
        if (teamInfo) {
          teamInfoMap.set(teamId, teamInfo);
        }
      })
    );

    const matchesWithDetails: MatchWithDetails[] = matches.map((m) => {
      const challengerTeam = teamInfoMap.get(m.challengerTeamId);
      const defenderTeam = teamInfoMap.get(m.defenderTeamId);
      const winnerTeam = m.winnerTeamId
        ? teamInfoMap.get(m.winnerTeamId)
        : null;
      if (!challengerTeam || !defenderTeam) {
        throw new Error(`Missing team data for match ${m.id}`);
      }

      return {
        id: m.id,
        status: m.status,
        createdAt: m.createdAt!,
        updatedAt: m.updatedAt!,
        pyramidId: m.pyramidId,
        pyramidName: m.pyramidName || "Pirámide sin nombre",
        challengerTeam,
        defenderTeam,
        winnerTeam,
        evidenceUrl: m.evidenceUrl,
      };
    });

    // Separate pending matches (where user is defender) from history
    const pendingMatches = matchesWithDetails.filter(
      (m) => m.status === "pending" && userTeamIds.includes(m.defenderTeam.id)
    );

    const matchHistory = matchesWithDetails.filter(
      (m) => !pendingMatches.includes(m)
    );

    return { pendingMatches, matchHistory };
  } catch (error) {
    console.error("Error fetching user matches:", error);
    return { pendingMatches: [], matchHistory: [] };
  }
}
