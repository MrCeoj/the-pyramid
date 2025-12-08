"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, isNull } from "drizzle-orm";
import {
  position,
  team,
  pyramid,
  profile,
  users,
  getTeamDisplayName
} from "@/db/schema";

import {Position, PyramidData, Team} from "@/actions/IndexActions/types"



export async function getPlayerPyramid(
  userId: string
): Promise<PyramidData | null> {
  try {
    // Find all teams where this user is a player
    const userTeams = await db
      .select({
        id: team.id,
      })
      .from(team)
      .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

    if (!userTeams.length) {
      return null;
    }

    const teamId = userTeams[0].id;

    // Find pyramid where this team is positioned
    const teamPosition = await db
      .select({
        pyramidId: position.pyramidId,
      })
      .from(position)
      .where(eq(position.teamId, teamId))
      .limit(1);

    if (!teamPosition.length) {
      return null;
    }

    const pyramidId = teamPosition[0].pyramidId;

    // Get pyramid info
    const pyramidInfo = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        row_amount: pyramid.row_amount,
      })
      .from(pyramid)
      .where(and(eq(pyramid.id, pyramidId), eq(pyramid.active, true)))
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
        teamWins: team.wins,
        teamLosses: team.losses,
        teamStatus: team.status,
        teamCategoryId: team.categoryId,
        teamLoosingStreak: team.loosingStreak,
        teamLastResult: team.lastResult,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
        teamDefendable: team.defendable
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
              nickname: pos.player1Nickname ?? "",
            }
          : null;

        const player2 = pos.player2Id
          ? {
              id: pos.player2Id,
              paternalSurname: player2Data?.[0]?.paternalSurname ?? "",
              maternalSurname: player2Data?.[0]?.maternalSurname ?? "",
              nickname: player2Data?.[0]?.nickname ?? "",
            }
          : null;

        const teamData: Team = {
          id: pos.teamId,
          displayName: getTeamDisplayName(player1, player2),
          wins: pos.teamWins || 0,
          losses: pos.teamLosses || 0,
          status: pos.teamStatus || "idle",
          categoryId: pos.teamCategoryId,
          defendable: pos.teamDefendable!,
          loosingStreak: pos.teamLoosingStreak || 0,
          lastResult: pos.teamLastResult || "none",
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
    };
  } catch (error) {
    console.error("Error fetching player pyramid:", error);
    return null;
  }
}