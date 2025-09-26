"use server";
import { db } from "@/lib/drizzle";
import { eq, or } from "drizzle-orm";
import { team, profile, users } from "@/db/schema";
import { getTeamDisplayName } from "@/db/schema";
import { TeamWithPlayers } from "@/actions/PositionActions";

export async function getTeamInfo(
  teamId: number
): Promise<TeamWithPlayers | null> {
  const teamData = await db
    .select({
      id: team.id,
      categoryId: team.categoryId,
      wins: team.wins,
      losses: team.losses,
      status: team.status,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
    })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (!teamData.length) return null;

  const teamRecord = teamData[0];

  // Create queries only for non-null player IDs
  const playerQueries = [];

  if (teamRecord.player1Id) {
    playerQueries.push(
      db
        .select({
          id: users.id,
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          email: users.email,
          nickname: profile.nickname,
        })
        .from(users)
        .where(eq(users.id, teamRecord.player1Id))
        .leftJoin(profile, eq(users.id, profile.userId))
        .limit(1)
        .then((result) => ({ playerIndex: 1, data: result }))
    );
  }

  if (teamRecord.player2Id) {
    playerQueries.push(
      db
        .select({
          id: users.id,
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          email: users.email, // ADD EMAIL HERE
          nickname: profile.nickname,
        })
        .from(users)
        .where(eq(users.id, teamRecord.player2Id))
        .leftJoin(profile, eq(users.id, profile.userId))
        .limit(1)
        .then((result) => ({ playerIndex: 2, data: result }))
    );
  }

  // If no players at all, return null
  if (playerQueries.length === 0) return null;

  const playersResults = await Promise.all(playerQueries);

  // Initialize players as null
  let player1 = null;
  let player2 = null;

  // Process results and assign to correct player slots
  for (const result of playersResults) {
    if (result.data.length > 0) {
      const playerData = {
        id: result.data[0].id,
        paternalSurname: result.data[0].paternalSurname,
        maternalSurname: result.data[0].maternalSurname,
        email: result.data[0].email, // ADD EMAIL HERE
        nickname: result.data[0].nickname,
      };

      if (result.playerIndex === 1) {
        player1 = playerData;
      } else {
        player2 = playerData;
      }
    }
  }

  // Handle empty players with proper typing
  if (!player1) {
    player1 = {
      id: "",
      maternalSurname: "",
      paternalSurname: "",
      nickname: "",
      email: null,
    };
  }

  if (!player2) {
    player2 = {
      id: "",
      maternalSurname: "",
      paternalSurname: "",
      nickname: "",
      email: null,
    };
  }

  if (player1 || player2) {
    return {
      id: teamRecord.id,
      displayName: getTeamDisplayName(player1, player2),
      categoryId: teamRecord.categoryId,
      wins: teamRecord.wins || 0,
      losses: teamRecord.losses || 0,
      status: teamRecord.status || "idle",
      player1,
      player2,
    };
  }

  return null;
}

export async function getTeamWithPlayers(
  teamId: number
): Promise<TeamWithPlayers | null> {
  try {
    const teamData = await db
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
      .where(eq(team.id, teamId))
      .limit(1);

    if (!teamData.length) {
      return null;
    }

    if (!teamData[0].player1Id && !teamData[0].player2Id) {
      return null;
    }

    const [player1Data, player2Data] = await Promise.all([
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
          email: users.email,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData[0].player1Id!)),
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
          email: users.email,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData[0].player2Id!)),
    ]);

    if (!player1Data.length && !player2Data.length) {
      return null;
    }
    const player1Row = player1Data[0] ?? {};
    const player2Row = player2Data[0] ?? {};

    const player1Id = teamData[0].player1Id;
    const player2Id = teamData[0].player2Id;

    if (!player1Id && !player2Id) return null;

    const player1 = {
      id: player1Id ?? "",
      paternalSurname: player1Row.paternalSurname ?? "",
      maternalSurname: player1Row.maternalSurname ?? "",
      nickname: player1Row.nickname ?? "",
      email: player1Row.email ?? "",
    };

    const player2 = {
      id: player2Id ?? "",
      paternalSurname: player2Row.paternalSurname ?? "",
      maternalSurname: player2Row.maternalSurname ?? "",
      nickname: player2Row.nickname ?? "",
      email: player2Row.email ?? "",
    };

    return {
      id: teamData[0].id,
      displayName: getTeamDisplayName(player1, player2),
      wins: teamData[0].wins || 0,
      losses: teamData[0].losses || 0,
      status: teamData[0].status || "idle",
      categoryId: teamData[0].categoryId,
      player1,
      player2,
    };
  } catch (error) {
    console.error("Error fetching team data:", error);
    return null;
  }
}

export async function getUserTeamIds(userId: string): Promise<number[]> {
  const userTeams = await db
    .select({ id: team.id })
    .from(team)
    .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

  return userTeams.map((t) => t.id);
}
