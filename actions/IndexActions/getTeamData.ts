"use server";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { getTeamDisplayName } from "@/lib/utils";
import { team, profile, users, position } from "@/db/schema";

export async function getTeamData(
  teamId: number,
): Promise<TeamWithPlayers | null> {
  try {
    const [teamData] = await db
      .select({
        id: team.id,
        wins: position.wins,
        losses: position.losses,
        score: position.score,
        status: position.status,
        losingStreak: position.losingStreak,
        winningStreak: position.winningStreak,
        lastResult: position.lastResult,
        categoryId: team.categoryId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
      })
      .from(team)
      .innerJoin(position, eq(team.id, position.teamId))
      .where(eq(team.id, teamId))
      .limit(1);

    if (!teamData) {
      return null;
    }

    if (!teamData.player1Id || !teamData.player2Id) {
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
        .where(eq(users.id, teamData.player1Id)),
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData.player2Id)),
    ]);

    if (!player1Data.length || !player2Data.length) {
      return null;
    }
    const player1Id = teamData.player1Id;
    const player2Id = teamData.player2Id;

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
      id: teamData.id,
      displayName: getTeamDisplayName(player1, player2),
      wins: teamData.wins || 0,
      losses: teamData.losses || 0,
      score: teamData.score || 0,
      status: teamData.status || "idle",
      losingStreak: teamData.losingStreak || 0,
      winningStreak: teamData.winningStreak || 0,
      lastResult: teamData.lastResult || "none",
      categoryId: teamData.categoryId,
      categoryName: null,
      player1,
      player2,
    };
  } catch (error) {
    console.error("Error fetching team data:", error);
    return null;
  }
}
