"use server";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { getTeamDisplayName } from "@/lib/utils";
import {
  position,
  team,
  pyramid,
  profile,
  users,
} from "@/db/schema";
import { aliasedTable } from "drizzle-orm";

export async function getPyramidData(
  pyramidId: number
): Promise<PyramidData | null> {
  try {
    // 1. Pyramid info
    const pyramidInfo = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        row_amount: pyramid.row_amount,
        description: pyramid.description,
        active: pyramid.active,
      })
      .from(pyramid)
      .where(eq(pyramid.id, pyramidId))
      .limit(1);

    if (!pyramidInfo.length) {
      return null;
    }

    const p1 = aliasedTable(users, "p1");
    const p2 = aliasedTable(users, "p2");
    const p1Profile = aliasedTable(profile, "p1Profile");
    const p2Profile = aliasedTable(profile, "p2Profile");

    // 2. Positions with full team + player data
    const rows = await db
      .select({
        positionId: position.id,
        row: position.row,
        col: position.col,
        defendable: position.defendable,

        teamId: team.id,
        teamWins: position.wins,
        teamLosses: position.losses,
        teamScore: position.score,
        teamStatus: position.status,
        teamCategoryId: team.categoryId,
        teamLosingStreak: position.losingStreak,
        teamWinningStreak: position.winningStreak,
        teamLastResult: position.lastResult,

        player1Id: team.player1Id,
        player2Id: team.player2Id,

        p1PaternalSurname: p1.paternalSurname,
        p1MaternalSurname: p1.maternalSurname,
        p1Nickname: p1Profile.nickname,

        p2PaternalSurname: p2.paternalSurname,
        p2MaternalSurname: p2.maternalSurname,
        p2Nickname: p2Profile.nickname,
      })
      .from(position)
      .innerJoin(team, eq(position.teamId, team.id))
      .leftJoin(p1, eq(team.player1Id, p1.id))
      .leftJoin(p1Profile, eq(p1.id, p1Profile.userId))
      .leftJoin(p2, eq(team.player2Id, p2.id))
      .leftJoin(p2Profile, eq(p2.id, p2Profile.userId))
      .where(eq(position.pyramidId, pyramidId));

    // 3. Pure synchronous mapping
    const positions: Position[] = rows.map((r) => {
      const player1 = r.player1Id
        ? {
            id: r.player1Id,
            paternalSurname: r.p1PaternalSurname ?? "",
            maternalSurname: r.p1MaternalSurname ?? "",
            nickname: r.p1Nickname,
          }
        : null;

      const player2 = r.player2Id
        ? {
            id: r.player2Id,
            paternalSurname: r.p2PaternalSurname ?? "",
            maternalSurname: r.p2MaternalSurname ?? "",
            nickname: r.p2Nickname,
          }
        : null;

      const teamData: TeamWithPlayers = {
        id: r.teamId,
        displayName: getTeamDisplayName(player1, player2),
        wins: r.teamWins ?? 0,
        losses: r.teamLosses ?? 0,
        score: r.teamScore ?? 0,
        status: r.teamStatus ?? "idle",
        losingStreak: r.teamLosingStreak ?? 0,
        winningStreak: r.teamWinningStreak ?? 0,
        lastResult: r.teamLastResult ?? "none",
        categoryId: r.teamCategoryId,
        categoryName: null,
        defendable: r.defendable ?? false,
        player1,
        player2,
      };

      return {
        id: r.positionId,
        row: r.row,
        col: r.col,
        team: teamData,
      };
    });

    return {
      positions,
      row_amount: pyramidInfo[0].row_amount ?? 0,
      pyramid_id: pyramidInfo[0].id,
      pyramid_name: pyramidInfo[0].name,
      active: pyramidInfo[0].active,
      description: pyramidInfo[0].description,
    };
  } catch (error) {
    console.error("Error fetching pyramid data:", error);
    return null;
  }
}
