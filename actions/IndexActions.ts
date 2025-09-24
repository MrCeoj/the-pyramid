"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, isNull } from "drizzle-orm";
import { position, team, pyramid, profile, users, getTeamDisplayName } from "@/db/schema";

export type Team = {
  id: number;
  displayName: string;
  wins: number;
  losses: number;
  status: "winner" | "looser" | "idle" | "risky";
  categoryId: number | null;
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  } | null;
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  } | null;
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

    // For simplicity, let's get the pyramid for the first team
    // You might want to modify this logic based on your needs
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
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
      })
      .from(position)
      .where(eq(position.pyramidId, pyramidId))
      .innerJoin(team, eq(position.teamId, team.id))
      .innerJoin(users, eq(team.player1Id, users.id))
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
              paternalSurname: pos.player1PaternalSurname,
              maternalSurname: pos.player1MaternalSurname,
              nickname: pos.player1Nickname,
            }
          : null;

        const player2 = pos.player2Id
          ? {
              id: pos.player2Id,
              paternalSurname: player2Data?.[0]?.paternalSurname || "",
              maternalSurname: player2Data?.[0]?.maternalSurname || "",
              nickname: player2Data?.[0]?.nickname,
            }
          : null;

        const teamData: Team = {
          id: pos.teamId,
          displayName: getTeamDisplayName(player1, player2),
          wins: pos.teamWins || 0,
          losses: pos.teamLosses || 0,
          status: pos.teamStatus || "idle",
          categoryId: pos.teamCategoryId,
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

export async function getUserTeamIds(
  userId: string
): Promise<{ teamIds: number[] } | { error: string }> {
  try {
    if (!userId) {
      return { error: "User ID is required" };
    }

    // Get all teams where user is either player1 or player2
    const userTeams = await db
      .select({
        id: team.id,
      })
      .from(team)
      .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

    return { teamIds: userTeams.map((t) => t.id) };
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return { error: "Internal server error" };
  }
}

export async function getUserTeamId(
  userId: string
): Promise<{ teamId: number | null } | { error: string }> {
  try {
    const result = await getUserTeamIds(userId);

    if ("error" in result) {
      return result;
    }

    return { teamId: result.teamIds.length > 0 ? result.teamIds[0] : null };
  } catch (error) {
    console.error("Error fetching user team:", error);
    return { error: "Internal server error" };
  }
}

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
        teamWins: team.wins,
        teamLosses: team.losses,
        teamStatus: team.status,
        teamCategoryId: team.categoryId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player1PaternalSurname: users.paternalSurname,
        player1MaternalSurname: users.maternalSurname,
        player1Nickname: profile.nickname,
      })
      .from(position)
      .where(eq(position.pyramidId, pyramidId))
      .innerJoin(team, eq(position.teamId, team.id))
      .innerJoin(users, eq(team.player1Id, users.id))
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
              paternalSurname: pos.player1PaternalSurname,
              maternalSurname: pos.player1MaternalSurname,
              nickname: pos.player1Nickname,
            }
          : null;

        const player2 = pos.player2Id
          ? {
              id: pos.player2Id,
              paternalSurname: player2Data?.[0]?.paternalSurname || "",
              maternalSurname: player2Data?.[0]?.maternalSurname || "",
              nickname: player2Data?.[0]?.nickname,
            }
          : null;

        const teamData: Team = {
          id: pos.teamId,
          displayName: getTeamDisplayName(player1, player2),
          wins: pos.teamWins || 0,
          losses: pos.teamLosses || 0,
          status: pos.teamStatus || "idle",
          categoryId: pos.teamCategoryId,
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
    console.error("Error fetching pyramid data:", error);
    return null;
  }
}

export async function getAllPyramids(): Promise<PyramidOption[]> {
  try {
    console.log("Fetching pyramids");
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
    console.log("Fetching pyramids");
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

export async function getTeamData(teamId: number): Promise<Team | null> {
  try {
    const teamData = await db
      .select({
        id: team.id,
        wins: team.wins,
        losses: team.losses,
        status: team.status,
        categoryId: team.categoryId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
      })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (!teamData.length) {
      return null;
    }

    if (!teamData[0].player1Id || !teamData[0].player2Id) {
      return null;
    }

    // Now IDs are non-nullable
    const [player1Data, player2Data] = await Promise.all([
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData[0].player1Id)),
      db
        .select({
          paternalSurname: users.paternalSurname,
          maternalSurname: users.maternalSurname,
          nickname: profile.nickname,
        })
        .from(users)
        .leftJoin(profile, eq(users.id, profile.userId))
        .where(eq(users.id, teamData[0].player2Id)),
    ]);

    if (!player1Data.length || !player2Data.length) {
      return null;
    }
    const player1Id = teamData[0].player1Id;
    const player2Id = teamData[0].player2Id;

    if (!player1Id || !player2Id) return null; // Ensure IDs are not null

    const player1 = {
      id: player1Id,
      paternalSurname: player1Data[0].paternalSurname,
      maternalSurname: player1Data[0].maternalSurname,
      nickname: player1Data[0].nickname,
    };

    const player2 = {
      id: player2Id,
      paternalSurname: player2Data[0].paternalSurname,
      maternalSurname: player2Data[0].maternalSurname,
      nickname: player2Data[0].nickname,
    };

    return {
      id: teamData[0].id,
      displayName: getTeamDisplayName(player1, player2),
      wins: teamData[0].wins || 0,
      losses: teamData[0].losses || 0,
      status: teamData[0].status || "idle",
      categoryId: teamData[0].categoryId,
      player1,
      player2,
    };
  } catch (error) {
    console.error("Error fetching team data:", error);
    return null;
  }
}

export async function isUserInTeam(
  userId: string,
  teamId: number
): Promise<boolean> {
  try {
    const result = await db
      .select({ id: team.id })
      .from(team)
      .where(
        and(
          eq(team.id, teamId),
          or(eq(team.player1Id, userId), eq(team.player2Id, userId))
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking if user is in team:", error);
    return false;
  }
}
