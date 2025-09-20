"use server"
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { position, team, pyramid, profile } from "@/db/schema";

export type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
  status: string;
};

export type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

export type PyramidData = {
  positions: Position[];
  row_amount: number;
  pyramid_id: number;
  pyramid_name: string;
};

export type PyramidOption = {
  id: number;
  name: string;
  description: string | null;
};

export async function getPlayerPyramid(userId: string): Promise<PyramidData | null> {
  try {
    // Get user's team through profile
    const userProfile = await db
      .select({
        teamId: profile.teamId,
      })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);

    if (!userProfile.length || !userProfile[0].teamId) {
      return null;
    }

    const teamId = userProfile[0].teamId;

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
      .where(eq(pyramid.id, pyramidId))
      .limit(1);

    if (!pyramidInfo.length) {
      return null;
    }

    // Get all positions for this pyramid
    const positions = await db
      .select({
        id: position.id,
        row: position.row,
        col: position.col,
        team: {
          id: team.id,
          name: team.name,
          wins: team.wins,
          losses: team.losses,
          status: team.status
        },
      })
      .from(position)
      .where(eq(position.pyramidId, pyramidId))
      .innerJoin(team, eq(position.teamId, team.id)) as Position[];

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

export async function getPyramidData(pyramidId: number): Promise<PyramidData | null> {
  try {
    // Get pyramid info
    const pyramidInfo = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        row_amount: pyramid.row_amount,
      })
      .from(pyramid)
      .where(eq(pyramid.id, pyramidId))
      .limit(1);

    if (!pyramidInfo.length) {
      return null;
    }

    // Get all positions for this pyramid
    const positions = await db
      .select({
        id: position.id,
        row: position.row,
        col: position.col,
        team: {
          id: team.id,
          name: team.name,
          wins: team.wins,
          losses: team.losses,
        },
      })
      .from(position)
      .where(eq(position.pyramidId, pyramidId))
      .innerJoin(team, eq(position.teamId, team.id)) as Position[];

    return {
      positions,
      row_amount: pyramidInfo[0].row_amount || 0,
      pyramid_id: pyramidInfo[0].id,
      pyramid_name: pyramidInfo[0].name,
    };
  } catch (error) {
    console.error("Error fetching pyramid data:", error);
    return null;
  }
}

export async function getAllPyramids(): Promise<PyramidOption[]> {
  try {
    console.log("Fetching pyramids")
    const pyramids = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        description: pyramid.description,
      })
      .from(pyramid)
      .where(eq(pyramid.active, true))
      .orderBy(pyramid.name);

    return pyramids;
    
  } catch (error) {
    console.error("Error fetching pyramids:", error);
    return [];
  }
}

export async function getAllPyramidsTotal(): Promise<PyramidOption[]> {
  try {
    console.log("Fetching pyramids")
    const pyramids = await db
      .select({
        id: pyramid.id,
        name: pyramid.name,
        description: pyramid.description,
      })
      .from(pyramid)
      .orderBy(pyramid.name);

    return pyramids;
    
  } catch (error) {
    console.error("Hubo un error al conseguir las piramides:", error);
    return [];
  }
}
