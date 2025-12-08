"use server";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { team, profile, users, getTeamDisplayName } from "@/db/schema";

import { Team } from "@/actions/IndexActions/types";

export async function getTeamData(teamId: number): Promise<Team | null> {
  try {
    const teamData = await db
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

    if (!teamData.length) {
      return null;
    }

    if (!teamData[0].player1Id || !teamData[0].player2Id) {
      return null;
    }

    // Now IDs are non-nullable
    const [player1Data, player2Data] = await Promise.all([
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData[0].player1Id)),
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData[0].player2Id)),
    ]);

    if (!player1Data.length || !player2Data.length) {
      return null;
    }
    const player1Id = teamData[0].player1Id;
    const player2Id = teamData[0].player2Id;

    if (!player1Id || !player2Id) return null; // Ensure IDs are not null

    const player1 = {
      id: player1Id,
      paternalSurname: player1Data[0].paternalSurname,
      maternalSurname: player1Data[0].maternalSurname,
      nickname: player1Data[0].nickname,
    };

    const player2 = {
      id: player2Id,
      paternalSurname: player2Data[0].paternalSurname,
      maternalSurname: player2Data[0].maternalSurname,
      nickname: player2Data[0].nickname,
    };

    return {
      id: teamData[0].id,
      displayName: getTeamDisplayName(player1, player2),
      wins: teamData[0].wins || 0,
      losses: teamData[0].losses || 0,
      status: teamData[0].status || "idle",
      loosingStreak: teamData[0].loosingStreak || 0,
      lastResult: teamData[0].lastResult || "none",
      categoryId: teamData[0].categoryId,
      player1,
      player2,
    };
  } catch (error) {
    console.error("Error fetching team data:", error);
    return null;
  }
}
