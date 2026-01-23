"use server";
import {
  category,
  pyramidCategory,
  team,
  position,
  users,
  profile,
} from "@/db/schema";
import { getTeamDisplayName } from "@/lib/utils";
import { db } from "@/lib/drizzle";
import { inArray, eq, sql, aliasedTable } from "drizzle-orm";

export async function getApplicableTeams(
  pyramidId: number,
): Promise<TeamWithPlayers[]> {
  try {
    const categories = await db
      .select({ id: category.id })
      .from(category)
      .innerJoin(pyramidCategory, eq(pyramidCategory.categoryId, category.id))
      .where(eq(pyramidCategory.pyramidId, pyramidId));

    const categoryIds = categories.map(({ id }) => id);

    if (categoryIds.length === 0) {
      return [];
    }

    const p1 = aliasedTable(users, "p1");
    const p2 = aliasedTable(users, "p2");
    const p1Profile = aliasedTable(profile, "p1Profile");
    const p2Profile = aliasedTable(profile, "p2Profile");

    const teamsData = await db
      .select({
        id: team.id,
        wins: sql<number>`COALESCE(SUM(${position.wins}), 0)`,
        losses: sql<number>`COALESCE(SUM(${position.losses}), 0)`,
        categoryId: team.categoryId,
        score: sql<number>`COALESCE(SUM(${position.score}), 0)`,
        losingStreak: sql<number>`COALESCE(MAX(${position.losingStreak}), 0)`,
        winningStreak: sql<number>`COALESCE(MAX(${position.winningStreak}), 0)`,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: p1.paternalSurname,
        player1MaternalSurname: p1.maternalSurname,
        player1Nickname: p1Profile.nickname,
        player2PaternalSurname: p2.paternalSurname,
        player2MaternalSurname: p2.maternalSurname,
        player2Nickname: p2Profile.nickname,
      })
      .from(team)
      .leftJoin(position, eq(position.teamId, team.id))
      .leftJoin(p1, eq(p1.id, team.player1Id))
      .leftJoin(p1Profile, eq(p1.id, p1Profile.userId))
      .leftJoin(p2, eq(p2.id, team.player2Id))
      .leftJoin(p2Profile, eq(p2.id, p2Profile.userId))
      .where(inArray(team.categoryId, categoryIds))
      .groupBy(
        team.id,
        team.categoryId,
        team.player1Id,
        team.player2Id,
        p1.paternalSurname,
        p1.maternalSurname,
        p1Profile.nickname,
        p2.paternalSurname,
        p2.maternalSurname,
        p2Profile.nickname,
      );

    console.log(teamsData.length);

    const teams: TeamWithPlayers[] = teamsData.map((teamData) => {
      const [player1, player2] = [
        !!teamData.player1Id
          ? {
              id: teamData.player1Id,
              paternalSurname: teamData.player1PaternalSurname!,
              maternalSurname: teamData.player1MaternalSurname!,
              nickname: teamData.player1Nickname,
            }
          : null,
        !!teamData.player2Id
          ? {
              id: teamData.player2Id,
              paternalSurname: teamData.player2PaternalSurname!,
              maternalSurname: teamData.player2MaternalSurname!,
              nickname: teamData.player2Nickname,
            }
          : null,
      ];

      return {
        id: teamData.id,
        displayName: getTeamDisplayName(player1, player2),
        wins: teamData.wins,
        losses: teamData.losses,
        status: "idle",
        losingStreak: teamData.losingStreak,
        winningStreak: teamData.winningStreak,
        score: teamData.score,
        lastResult: "none",
        categoryId: teamData.categoryId,
        categoryName: null,
        player1,
        player2,
      };
    });

    return teams;
  } catch (error) {
    console.error("Error fetching applicable teams:", error);
    return [];
  }
}
