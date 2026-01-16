"use server"

import { category, users, profile, team } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, aliasedTable } from "drizzle-orm";
import { getTeamDisplayName } from "@/db/schema";

/**
 * Fetches all teams with their associated players, profiles, and categories.
 */
export async function getTeams(): Promise<TeamWithPlayers[]> {
  try {
    const user1 = aliasedTable(users, "user1");
    const user2 = aliasedTable(users, "user2");
    const profile1 = aliasedTable(profile, "profile1");
    const profile2 = aliasedTable(profile, "profile2");

    const teamsData = await db
      .select({
        team: {
          id: team.id,
          wins: team.wins,
          losses: team.losses,
          status: team.status,
          loosingStreak: team.loosingStreak,
          lastResult: team.lastResult,
        },
        category,
        user1: {
          id: user1.id,
          paternalSurname: user1.paternalSurname,
          maternalSurname: user1.maternalSurname,
        },
        profile1: {
          nickname: profile1.nickname,
        },
        user2: {
          id: user2.id,
          paternalSurname: user2.paternalSurname,
          maternalSurname: user2.maternalSurname,
        },
        profile2: {
          nickname: profile2.nickname,
        },
      })
      .from(team)
      .leftJoin(category, eq(team.categoryId, category.id))
      .leftJoin(user1, eq(team.player1Id, user1.id))
      .leftJoin(profile1, eq(user1.id, profile1.userId))
      .leftJoin(user2, eq(team.player2Id, user2.id))
      .leftJoin(profile2, eq(user2.id, profile2.userId));

    const structuredTeams = teamsData.map((row) => {
      const player1: TeamWithPlayers["player1"] | null = {
        id: row.user1!.id,
        paternalSurname: row.user1!.paternalSurname,
        maternalSurname: row.user1!.maternalSurname,
        email: row.user1?.maternalSurname,
        nickname: row.profile1?.nickname,
      };
      const player2: TeamWithPlayers["player2"] | null = {
        id: row.user2!.id,
        paternalSurname: row.user2!.paternalSurname,
        maternalSurname: row.user2!.maternalSurname,
        email: row.user2?.maternalSurname,
        nickname: row.profile2?.nickname,
      };

      const displayName = getTeamDisplayName(
        player1
          ? {
              id: player1.id,
              paternalSurname: player1.paternalSurname,
              maternalSurname: player1.maternalSurname,
              nickname: player1.nickname,
            }
          : null,
        player2
          ? {
              id: player2.id,
              paternalSurname: player2.paternalSurname,
              maternalSurname: player2.maternalSurname,
              nickname: player2.nickname,
            }
          : null,
      );

      return {
        id: row.team.id,
        wins: row.team.wins!,
        losses: row.team.losses!,
        status: row.team.status!,
        categoryId: row.category!.id,
        categoryName: row.category!.name,
        loosingStreak: row.team.loosingStreak!,
        lastResult: row.team.lastResult!,
        team: row.team,
        player1: player1,
        player2: player2,
        displayName,
      };
    });

    // Deduplicate teams since the joins can result in multiple rows per team
    const uniqueTeams = Array.from(
      new Map(structuredTeams.map((t) => [t.team.id, t])).values(),
    );

    return uniqueTeams;
  } catch (error) {
    console.error("Failed to get teams:", error);
    throw new Error("No se pudo conseguir a los equipos.");
  }
}

