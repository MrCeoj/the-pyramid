"use server";
import { db } from "@/lib/drizzle";
import { eq, or, inArray } from "drizzle-orm";
import { position, team, pyramid } from "@/db/schema";

import { PyramidOption } from "@/actions/IndexActions/types";

export async function getPlayerPyramids(
  userId: string
): Promise<PyramidOption[] | null> {
  try {
    const userTeams = await db
      .select({
        id: team.id,
      })
      .from(team)
      .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

    if (!userTeams.length) return null;

    const teamIds = userTeams.map((t) => t.id);

    const teamPositions = await db
      .select({
        pyramidId: position.pyramidId,
        teamId: position.teamId,
      })
      .from(position)
      .where(inArray(position.teamId, teamIds));

    if (!teamPositions.length) return null;

    const pyramidTeamMap = new Map<number, number>();
    for (const tp of teamPositions) {
      if (!pyramidTeamMap.has(tp.pyramidId)) {
        pyramidTeamMap.set(tp.pyramidId, tp.teamId);
      }
    }

    const pyramidIds = [...pyramidTeamMap.keys()];

    const pyramidsInfo = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        row_amount: pyramid.row_amount,
        description: pyramid.description,
        updated: pyramid.updatedAt,
        active: pyramid.active
      })
      .from(pyramid)
      .where(inArray(pyramid.id, pyramidIds));

    if (!pyramidsInfo.length) return null;

    const sortedPyrs = pyramidsInfo.sort((a, b) => {
      const aTime = a.updated?.getTime() ?? 0;
      const bTime = b.updated?.getTime() ?? 0;
      return bTime - aTime;
    });

    const result: PyramidOption[] = [];

    for (const p of sortedPyrs) {
      const teamId = pyramidTeamMap.get(p.id);
      if (teamId === undefined) continue;

      result.push({
        teamId,
        description: p.description,
        id: p.id,
        name: p.name,
        active: p.active
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching user pyramids:", error);
    return null;
  }
}
