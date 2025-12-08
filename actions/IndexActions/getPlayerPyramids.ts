"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, isNull, inArray } from "drizzle-orm";
import {
  position,
  team,
  pyramid,
  profile,
  users,
  getTeamDisplayName
} from "@/db/schema";

import { Position, PyramidData, Team } from "@/actions/IndexActions/types";

export async function getPlayerPyramids(
  userId: string
): Promise<PyramidData[] | null> {
  try {
    // 1. Find all teams the user belongs to
    const userTeams = await db
      .select({
        id: team.id,
      })
      .from(team)
      .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

    if (!userTeams.length) return null;

    const teamIds = userTeams.map(t => t.id);

    // 2. Find all pyramids where any of these teams is placed
    const teamPositions = await db
      .select({
        pyramidId: position.pyramidId,
        teamId: position.teamId,
      })
      .from(position)
      .where(inArray(position.teamId, teamIds));

    if (!teamPositions.length) return null;

    // Group by pyramid (avoid duplicates)
    const pyramidTeamMap = new Map<number, number>();
    for (const tp of teamPositions) {
      // The teamId here is the specific team the user has in that pyramid
      if (!pyramidTeamMap.has(tp.pyramidId)) {
        pyramidTeamMap.set(tp.pyramidId, tp.teamId);
      }
    }

    const pyramidIds = [...pyramidTeamMap.keys()];

    // 3. Fetch pyramid info
    const pyramidsInfo = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        row_amount: pyramid.row_amount,
        description: pyramid.description
      })
      .from(pyramid)
      .where(and(inArray(pyramid.id, pyramidIds), eq(pyramid.active, true)));

    if (!pyramidsInfo.length) return null;

    const result: PyramidData[] = [];

    // 4. Build data for each pyramid
    for (const p of pyramidsInfo) {
      const teamId = pyramidTeamMap.get(p.id);

      // Fetch every position in this pyramid
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
          teamDefendable: team.defendable,
        })
        .from(position)
        .where(eq(position.pyramidId, p.id))
        .innerJoin(team, eq(position.teamId, team.id))
        .leftJoin(users, eq(team.player1Id, users.id))
        .leftJoin(profile, eq(users.id, profile.userId));

      // Build enriched positions
      const positions: Position[] = await Promise.all(
        positionsWithTeams.map(async (pos) => {
          const player2Data = await db
            .select({
              paternalSurname: users.paternalSurname,
              maternalSurname: users.maternalSurname,
              nickname: profile.nickname,
            })
            .from(users)
            .where(
              pos.player2Id ? eq(users.id, pos.player2Id) : isNull(users.id)
            )
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
            defendable: pos.teamDefendable ?? false,
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

      // Push pyramid result
      result.push({
        positions,
        teamId,
        description: p.description,
        row_amount: p.row_amount || 0,
        pyramid_id: p.id,
        pyramid_name: p.name,
      });
    }

    console.log(result)

    return result;
  } catch (error) {
    console.error("Error fetching user pyramids:", error);
    return null;
  }
}