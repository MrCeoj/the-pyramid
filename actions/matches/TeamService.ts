"use server";
import { db } from "@/lib/drizzle";
import { eq, or, inArray } from "drizzle-orm";
import { team, profile, users } from "@/db/schema";
import { getTeamDisplayName } from "@/db/schema";

export async function getTeamWithPlayers(
  teamId: number
): Promise<TeamWithPlayers | null> {
  try {
    const [teamRecord] = await db
      .select({
        id: team.id,
        wins: team.wins,
        losses: team.losses,
        status: team.status,
        loosingStreak: team.loosingStreak,
        lastResult: team.lastResult,
        categoryId: team.categoryId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
      })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (!teamRecord) return null;
    if (!teamRecord.player1Id && !teamRecord.player2Id) return null;

    // 2. Build player queries dynamically (only for existing IDs)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerQueries: Promise<[number, any[]]>[] = [];

    if (teamRecord.player1Id) {
      playerQueries.push(
        db
          .select({
            id: users.id,
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            nickname: profile.nickname,
            email: users.email,
          })
          .from(users)
          .leftJoin(profile, eq(users.id, profile.userId))
          .where(eq(users.id, teamRecord.player1Id))
          .limit(1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((res) => [1, res] as [number, any[]])
      );
    }

    if (teamRecord.player2Id) {
      playerQueries.push(
        db
          .select({
            id: users.id,
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            nickname: profile.nickname,
            email: users.email,
          })
          .from(users)
          .leftJoin(profile, eq(users.id, profile.userId))
          .where(eq(users.id, teamRecord.player2Id))
          .limit(1)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((res) => [2, res] as [number, any[]])
      );
    }

    // 3. Resolve queries
    const results = await Promise.all(playerQueries);

    // 4. Build player objects with safe defaults
    let player1 = {
      id: "",
      paternalSurname: "",
      maternalSurname: "",
      nickname: "",
      email: "",
    };
    let player2 = {
      id: "",
      paternalSurname: "",
      maternalSurname: "",
      nickname: "",
      email: "",
    };

    for (const [index, res] of results) {
      if (res.length > 0) {
        const row = res[0];
        const player = {
          id: row.id ?? "",
          paternalSurname: row.paternalSurname ?? "",
          maternalSurname: row.maternalSurname ?? "",
          nickname: row.nickname ?? "",
          email: row.email ?? "",
        };
        if (index === 1) player1 = player;
        else player2 = player;
      }
    }

    // 5. Return final team object
    return {
      id: teamRecord.id,
      displayName: getTeamDisplayName(player1, player2),
      wins: teamRecord.wins || 0,
      losses: teamRecord.losses || 0,
      status: teamRecord.status || "idle",
      loosingStreak: teamRecord.loosingStreak || 0,
      lastResult: teamRecord.lastResult || "none",
      categoryId: teamRecord.categoryId,
      player1,
      player2,
    };
  } catch (error) {
    console.error("Error fetching team data:", error);
    return null;
  }
}

export async function getBulkTeamsWithPlayers(
  teamIds: number[]
): Promise<TeamWithPlayers[]> {
  if (teamIds.length === 0) return [];

  const teamRecords = await db
    .select({
      id: team.id,
      wins: team.wins,
      losses: team.losses,
      status: team.status,
      categoryId: team.categoryId,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
    })
    .from(team)
    .where(inArray(team.id, teamIds));

  if (!teamRecords.length) return [];

  const playerIds = teamRecords
    .flatMap((t) => [t.player1Id, t.player2Id])
    .filter(Boolean) as string[];

  const players = await db
    .select({
      id: users.id,
      paternalSurname: users.paternalSurname,
      maternalSurname: users.maternalSurname,
      email: users.email,
      nickname: profile.nickname,
    })
    .from(users)
    .leftJoin(profile, eq(users.id, profile.userId))
    .where(inArray(users.id, playerIds));

  const playerMap = new Map(
    players.map((p) => [
      p.id,
      {
        id: p.id ?? "",
        paternalSurname: p.paternalSurname ?? "",
        maternalSurname: p.maternalSurname ?? "",
        nickname: p.nickname ?? "",
        email: p.email ?? "",
      },
    ])
  );

  return teamRecords.map((t) => {
    const player1 = t.player1Id ? playerMap.get(t.player1Id) ?? null : null;
    const player2 = t.player2Id ? playerMap.get(t.player2Id) ?? null : null;

    return {
      id: t.id,
      displayName: getTeamDisplayName(player1, player2),
      wins: t.wins || 0,
      losses: t.losses || 0,
      status: t.status || "idle",
      categoryId: t.categoryId,
      player1,
      player2,
    } as TeamWithPlayers;
  });
}

export async function getUserTeamIds(userId: string): Promise<number[]> {
  const userTeams = await db
    .select({ id: team.id })
    .from(team)
    .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

  return userTeams.map((t) => t.id);
}
