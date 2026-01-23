"use server";
import {
  category,
  pyramidCategory,
  team,
  position,
  users,
  profile
} from "@/db/schema";
import { getTeamDisplayName } from "@/lib/utils";
import { db } from "@/lib/drizzle";
import { eq, inArray } from "drizzle-orm";

export async function getApplicableTeams(
  pyramidId: number,
): Promise<TeamWithPlayers[]> {
  try {
    // Get categories for this pyramid
    const categories = await db
      .select({ id: category.id })
      .from(category)
      .innerJoin(pyramidCategory, eq(pyramidCategory.categoryId, category.id))
      .where(eq(pyramidCategory.pyramidId, pyramidId));

    const categoryIds = categories.map(({ id }) => id);

    if (categoryIds.length === 0) {
      return [];
    }

    // Get teams in those categories with player data
    const teamsData = await db
      .select({
        id: team.id,
        wins: position.wins,
        losses: position.losses,
        status: position.status,
        categoryId: team.categoryId,
        losingStreak: position.losingStreak,
        lastResult: position.lastResult,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
        player2PaternalSurname: users.paternalSurname,
        player2MaternalSurname: users.maternalSurname,
        player2Nickname: profile.nickname,
      })
      .from(team)
      .where(inArray(team.categoryId, categoryIds))
      .leftJoin(users, eq(team.player1Id, users.id))
      .leftJoin(profile, eq(users.id, profile.userId));

    const teams: TeamWithPlayers[] = (await Promise.all(
      teamsData.map(async (teamData) => {
        const player2Data = await db
          .select({
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            nickname: profile.nickname,
          })
          .from(users)
          .where(eq(users.id, teamData.player2Id!))
          .leftJoin(profile, eq(users.id, profile.userId))
          .limit(1);

        const player1 = teamData.player1Id
          ? {
              id: teamData.player1Id,
              paternalSurname: teamData.player1PaternalSurname ?? "",
              maternalSurname: teamData.player1MaternalSurname ?? "",
              nickname: teamData.player1Nickname ?? undefined,
            }
          : null;

        const player2 = {
          id: teamData.player2Id!,
          paternalSurname: player2Data[0].paternalSurname ?? "",
          maternalSurname: player2Data[0].maternalSurname ?? "",
          nickname: player2Data[0].nickname,
        };

        return {
          id: teamData.id,
          displayName: getTeamDisplayName(player1, player2),
          wins: teamData.wins || 0,
          losses: teamData.losses || 0,
          status: teamData.status || "idle",
          losingStreak: teamData.losingStreak || 0,
          lastResult: teamData.lastResult || "none",
          categoryId: teamData.categoryId,
          categoryName: null,
          player1,
          player2,
        };
      }),
    ));

    return teams;
  } catch (error) {
    console.error("Error fetching applicable teams:", error);
    return [];
  }
}
