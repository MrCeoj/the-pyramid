"use server"
import { category, pyramidCategory, team, users, profile, getTeamDisplayName } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, inArray } from "drizzle-orm";

export async function getApplicableTeams(
  pyramidId: number
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
        wins: team.wins,
        losses: team.losses,
        status: team.status,
        categoryId: team.categoryId,
        loosingStreak: team.loosingStreak,
        lastResult: team.lastResult,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
      })
      .from(team)
      .where(inArray(team.categoryId, categoryIds))
      .innerJoin(users, eq(team.player1Id, users.id))
      .innerJoin(profile, eq(users.id, profile.userId));

    const teams: TeamWithPlayers[] = await Promise.all(
      teamsData.map(async (teamData) => {
        const player2Data = await db
          .select({
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            nickname: profile.nickname,
          })
          .from(users)
          .where(eq(users.id, teamData.player2Id!)) // <-- non-null assertion
          .leftJoin(profile, eq(users.id, profile.userId))
          .limit(1);

        const player1 = {
          id: teamData.player1Id!,
          paternalSurname: teamData.player1PaternalSurname,
          maternalSurname: teamData.player1MaternalSurname,
          nickname: teamData.player1Nickname,
        };

        const player2 = {
          id: teamData.player2Id!,
          paternalSurname: player2Data[0]?.paternalSurname || "",
          maternalSurname: player2Data[0]?.maternalSurname || "",
          nickname: player2Data[0]?.nickname,
        };

        return {
          id: teamData.id,
          displayName: getTeamDisplayName(player1, player2),
          wins: teamData.wins || 0,
          losses: teamData.losses || 0,
          status: teamData.status || "idle",
          loosingStreak: teamData.loosingStreak || 0,
          lastResult: teamData.lastResult || "none",
          categoryId: teamData.categoryId,
          categoryName: null,
          player1,
          player2,
        };
      })
    );

    return teams;
  } catch (error) {
    console.error("Error fetching applicable teams:", error);
    return [];
  }
}