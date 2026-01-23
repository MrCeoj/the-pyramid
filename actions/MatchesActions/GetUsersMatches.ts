"use server";
import { db } from "@/lib/drizzle";
import { eq, or, desc, inArray } from "drizzle-orm";
import { match, pyramid, positionHistory, position } from "@/db/schema";
import {
  getTeamWithPlayers,
  getUserTeamIds,
} from "@/actions/MatchesActions/TeamService";

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
        pyramidName: pyramid.name,
      })
      .from(match)
      .innerJoin(pyramid, eq(match.pyramidId, pyramid.id))
      .where(
        or(
          inArray(match.challengerTeamId, userTeamIds),
          inArray(match.defenderTeamId, userTeamIds),
        ),
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
      }),
    );

    // Collect match IDs
    const matchIds = matches.map((m) => m.id);

    // Fetch all position history entries related to these matches & teams
    const positionsHistory = await db
      .select()
      .from(positionHistory)
      .where(inArray(positionHistory.matchId, matchIds))
      .orderBy(desc(positionHistory.effectiveDate));

    const positions = await db
      .select()
      .from(position)
      .where(inArray(position.teamId, Array.from(teamIds)));

    const positionMap = new Map<number, (typeof positionsHistory)[number]>();

    for (const p of positionsHistory) {
      const key = p.matchId!;
      if (!positionMap.has(key)) {
        positionMap.set(key, p); // first one is latest because of DESC order
      }
    }

    const matchesWithDetails: MatchWithDetails[] = matches.map((m) => {
      const challengerTeam = teamInfoMap.get(m.challengerTeamId);
      const defenderTeam = teamInfoMap.get(m.defenderTeamId);

      if (!challengerTeam || !defenderTeam) {
        throw new Error(`Missing team data for match ${m.id}`);
      }

      const positionPyramid = positions.filter(
        (p) => p.pyramidId === m.pyramidId,
      );
      const challengerCurrentPos = positionPyramid.find(
        (p) => p.teamId === challengerTeam.id,
      );
      const defenderCurrentPos = positionPyramid.find(
        (p) => p.teamId === defenderTeam.id,
      );

      const matchPosition = positionMap.get(m.id);

      const isFinalized = !["pending", "accepted"].includes(m.status);
      const snapshot = isFinalized ? positionMap.get(m.id) : null;

      const challengerPos = isFinalized
        ? {
            row: snapshot?.oldRow ?? null,
            col: snapshot?.oldCol ?? null,
          }
        : {
            row: challengerCurrentPos?.row ?? null,
            col: challengerCurrentPos?.col ?? null,
          };

      const defenderPos = isFinalized
        ? {
            row: snapshot?.affectedOldRow ?? null,
            col: snapshot?.affectedOldCol ?? null,
          }
        : {
            row: defenderCurrentPos?.row ?? null,
            col: defenderCurrentPos?.col ?? null,
          };

      return {
        id: m.id,
        status: m.status,
        createdAt: m.createdAt!,
        updatedAt: m.updatedAt!,
        pyramidId: m.pyramidId,
        pyramidName: m.pyramidName || "Pirámide sin nombre",
        challengerTeam: {
          ...challengerTeam,
          currentRow: challengerPos.row ?? null,
          currentCol: challengerPos.col ?? null,
        },
        defenderTeam: {
          ...defenderTeam,
          currentRow: defenderPos.row ?? null,
          currentCol: defenderPos.col ?? null,
        },
        winnerTeam: m.winnerTeamId
          ? (teamInfoMap.get(m.winnerTeamId) ?? null)
          : null,
      };
    });

    // Separate pending matches (where user is defender) from history
    const pendingMatches = matchesWithDetails.filter(
      (m) => m.status === "pending" && userTeamIds.includes(m.defenderTeam.id),
    );

    const matchHistory = matchesWithDetails.filter(
      (m) => !pendingMatches.includes(m),
    );

    return { pendingMatches, matchHistory };
  } catch (error) {
    console.error("Error fetching user matches:", error);
    return { pendingMatches: [], matchHistory: [] };
  }
}
