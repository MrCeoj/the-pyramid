"use server";
import { db } from "@/lib/drizzle";
import { eq, isNull } from "drizzle-orm";
import { getTeamDisplayName } from "@/lib/utils";
import {
  position,
  team,
  pyramid,
  profile,
  users,
} from "@/db/schema";

export async function getPyramidData(
  pyramidId: number
): Promise<PyramidData | null> {
  try {
    // Get pyramid info
    const pyramidInfo = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        row_amount: pyramid.row_amount,
        description: pyramid.description,
        active: pyramid.active
      })
      .from(pyramid)
      .where(eq(pyramid.id, pyramidId))
      .limit(1);

    if (!pyramidInfo.length) {
      return null;
    }

    // Get all positions for this pyramid with team and player data
    const positionsWithTeams = await db
      .select({
        positionId: position.id,
        row: position.row,
        col: position.col,
        teamId: team.id,
        teamWins: position.wins,
        teamLosses: position.losses,
        teamStatus: position.status,
        teamCategoryId: team.categoryId,
        teamLosingStreak: position.losingStreak,
        teamLastResult: position.lastResult,
        defendable: position.defendable,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
      })
      .from(position)
      .where(eq(position.pyramidId, pyramidId))
      .innerJoin(team, eq(position.teamId, team.id))
      .leftJoin(users, eq(team.player1Id, users.id))
      .leftJoin(profile, eq(users.id, profile.userId));

    // Get player2 data for each team
    const positions: Position[] = await Promise.all(
      positionsWithTeams.map(async (pos) => {
        // Get player2 data
        const player2Data = await db
          .select({
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            nickname: profile.nickname,
          })
          .from(users)
          .where(pos.player2Id ? eq(users.id, pos.player2Id) : isNull(users.id))
          .leftJoin(profile, eq(users.id, profile.userId))
          .limit(1);

        const player1 = pos.player1Id
          ? {
              id: pos.player1Id,
              paternalSurname: pos.player1PaternalSurname ?? "",
              maternalSurname: pos.player1MaternalSurname ?? "",
              nickname: pos.player1Nickname ?? null,
            }
          : null;

        const player2 = pos.player2Id
          ? {
              id: pos.player2Id,
              paternalSurname: player2Data?.[0]?.paternalSurname ?? "",
              maternalSurname: player2Data?.[0]?.maternalSurname ?? "",
              nickname: player2Data?.[0]?.nickname,
            }
          : null;

        const teamData: TeamWithPlayers = {
          id: pos.teamId,
          displayName: getTeamDisplayName(player1, player2),
          wins: pos.teamWins || 0,
          losses: pos.teamLosses || 0,
          status: pos.teamStatus || "idle",
          losingStreak: pos.teamLosingStreak || 0,
          lastResult: pos.teamLastResult || "none",
          categoryId: pos.teamCategoryId,
          categoryName: null,
          defendable: pos.defendable || false,
          player1,
          player2,
        };

        return {
          id: pos.positionId,
          row: pos.row,
          col: pos.col,
          team: teamData,
        };
      })
    );

    return {
      positions,
      row_amount: pyramidInfo[0].row_amount || 0,
      pyramid_id: pyramidInfo[0].id,
      pyramid_name: pyramidInfo[0].name,
      active: pyramidInfo[0].active,
      description: pyramidInfo[0].description
    };
  } catch (error) {
    console.error("Error fetching pyramid data:", error);
    return null;
  }
}