"use server";

import { db } from "@/lib/drizzle";
import { match, team, users, profile } from "@/db/schema";
import { eq, and, isNotNull, inArray } from "drizzle-orm";
import { getTeamDisplayName } from "@/lib/utils";

type MatchHistoryItem = {
  matchId: number;
  challengerTeam: string;
  defenderTeam: string;
  updatedAt: Date;
};

export async function GetPlayedMatchHistory(
  pyramidId: number
): Promise<MatchHistoryItem[]> {
  // Get all played matches for this pyramid
  const playedMatches = await db
    .select({
      matchId: match.id,
      challengerTeamId: match.challengerTeamId,
      defenderTeamId: match.defenderTeamId,
      winnerTeamId: match.winnerTeamId,
      updatedAt: match.updatedAt,
    })
    .from(match)
    .where(
      and(
        eq(match.pyramidId, pyramidId),
        eq(match.status, "played"),
        isNotNull(match.winnerTeamId)
      )
    )
    .orderBy(match.updatedAt);

  // Get all unique team IDs
  const teamIds = new Set<number>();
  playedMatches.forEach((m) => {
    teamIds.add(m.challengerTeamId);
    teamIds.add(m.defenderTeamId);
  });

  // Fetch all teams with their players
  const teams = await db
    .select({
      id: team.id,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
    })
    .from(team)
    .where(
      inArray(
        team.id,
        Array.from(teamIds)
      )
    );

    console.log(teams)

  // Get all user IDs
  const userIds = new Set<string>();
  teams.forEach((t) => {
    if (t.player1Id) userIds.add(t.player1Id);
    if (t.player2Id) userIds.add(t.player2Id);
  });
  

  // Fetch users and profiles
  const usersData = await db
    .select({
      id: users.id,
      paternalSurname: users.paternalSurname,
      maternalSurname: users.maternalSurname,
      nickname: profile.nickname,
    })
    .from(users)
    .leftJoin(profile, eq(users.id, profile.userId))
    .where(inArray(users.id, Array.from(userIds))); 
    console.log(usersData)
  // Create a map of users
  const userMap = new Map(
    usersData.map((u) => [
      u.id,
      {
        id: u.id,
        paternalSurname: u.paternalSurname,
        maternalSurname: u.maternalSurname,
        nickname: u.nickname,
      },
    ])
  );

  // Create team map with display names
  const teamMap = new Map(
    teams.map((t) => {
      const player1 = t.player1Id ? userMap.get(t.player1Id) : null;
      const player2 = t.player2Id ? userMap.get(t.player2Id) : null;
      return [
        t.id,
        getTeamDisplayName(
          player1 || null,
          player2 || null
        ),
      ];
    })
  );

  // Build response
  return playedMatches.map((m) => {
    const challengerName = teamMap.get(m.challengerTeamId) || "Desconocido";
    const defenderName = teamMap.get(m.defenderTeamId) || "Desconocido";
    
    const challengerIsWinner = m.winnerTeamId === m.challengerTeamId;
    
    return {
      matchId: m.matchId,
      challengerTeam: challengerIsWinner 
        ? `${challengerName} (W)` 
        : `${challengerName} (L)`,
      defenderTeam: challengerIsWinner 
        ? `${defenderName} (L)` 
        : `${defenderName} (W)`,
      updatedAt: m.updatedAt!,
    };
  });
}