"use server";
import { db } from "@/lib/drizzle";
import { team, profile, category, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";

// Helper function to generate team display name
function getTeamDisplayName(
  player1: {
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  },
  player2: {
    paternalSurname: string;
    maternalSurname: string;
    nickname?: string | null;
  }
): string {
  // If both players have nicknames, use those
  if (player1.nickname && player2.nickname) {
    return `${player1.nickname} / ${player2.nickname}`;
  }

  // If only one has nickname, use nickname + surname
  if (player1.nickname && !player2.nickname) {
    return `${player1.nickname} / ${player2.paternalSurname}`;
  }

  if (!player1.nickname && player2.nickname) {
    return `${player1.paternalSurname} / ${player2.nickname}`;
  }

  // Default: use both paternal surnames
  return `${player1.paternalSurname} / ${player2.paternalSurname}`;
}

export interface TeamWithPlayers {
  id: number;
  displayName: string;
  wins: number;
  losses: number;
  status: "winner" | "looser" | "idle" | "risky";
  categoryId: number | null;
  category: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  player1: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    fullName: string;
    nickname: string | null;
    email: string | null;
  };
  player2: {
    id: string;
    paternalSurname: string;
    maternalSurname: string;
    fullName: string;
    nickname: string | null;
    email: string | null;
  };
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTeamData {
  player1Id: string;
  player2Id: string;
  categoryId: number;
  status?: "idle" | "winner" | "looser" | "risky";
}

export interface UpdateTeamData {
  player1Id?: string;
  player2Id?: string;
  categoryId?: number;
  status?: "idle" | "winner" | "looser" | "risky";
}

// Fetch all teams with their players and category info
export async function getTeams(): Promise<TeamWithPlayers[]> {
  const teamsData = await db
    .select({
      teamId: team.id,
      teamWins: team.wins,
      teamLosses: team.losses,
      teamStatus: team.status,
      teamCategoryId: team.categoryId,
      teamCreatedAt: team.createdAt,
      teamUpdatedAt: team.updatedAt,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
      categoryId: category.id,
      categoryName: category.name,
      categoryDescription: category.description,
    })
    .from(team)
    .leftJoin(category, eq(team.categoryId, category.id));

  const teamsWithPlayers: TeamWithPlayers[] = await Promise.all(
    teamsData.map(async (teamData) => {
      // Get both players' data
      const [player1Data, player2Data] = await Promise.all([
        db
          .select({
            id: users.id,
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            email: users.email,
            nickname: profile.nickname,
          })
          .from(users)
          .where(eq(users.id, teamData.player1Id))
          .leftJoin(profile, eq(users.id, profile.userId))
          .limit(1),
        db
          .select({
            id: users.id,
            paternalSurname: users.paternalSurname,
            maternalSurname: users.maternalSurname,
            email: users.email,
            nickname: profile.nickname,
          })
          .from(users)
          .where(eq(users.id, teamData.player2Id))
          .leftJoin(profile, eq(users.id, profile.userId))
          .limit(1),
      ]);

      if (!player1Data.length || !player2Data.length) {
        throw new Error(`Missing player data for team ${teamData.teamId}`);
      }

      const player1 = {
        id: player1Data[0].id,
        paternalSurname: player1Data[0].paternalSurname,
        maternalSurname: player1Data[0].maternalSurname,
        fullName: `${player1Data[0].paternalSurname} ${player1Data[0].maternalSurname}`,
        nickname: player1Data[0].nickname,
        email: player1Data[0].email,
      };

      const player2 = {
        id: player2Data[0].id,
        paternalSurname: player2Data[0].paternalSurname,
        maternalSurname: player2Data[0].maternalSurname,
        fullName: `${player2Data[0].paternalSurname} ${player2Data[0].maternalSurname}`,
        nickname: player2Data[0].nickname,
        email: player2Data[0].email,
      };

      return {
        id: teamData.teamId,
        displayName: getTeamDisplayName(player1, player2),
        wins: teamData.teamWins || 0,
        losses: teamData.teamLosses || 0,
        status: teamData.teamStatus || "idle",
        categoryId: teamData.teamCategoryId,
        category: teamData.categoryId
          ? {
              id: teamData.categoryId,
              name: teamData.categoryName!,
              description: teamData.categoryDescription,
            }
          : null,
        player1,
        player2,
        createdAt: teamData.teamCreatedAt,
        updatedAt: teamData.teamUpdatedAt,
      };
    })
  );

  return teamsWithPlayers;
}

// Fetch categories
export async function getCategories() {
  return await db.select().from(category);
}

// Create team with two players
export async function createTeam(data: CreateTeamData) {
  // Validate that both players exist and are different
  if (data.player1Id === data.player2Id) {
    throw new Error(
      "No se puede crear un equipo con el mismo jugador dos veces"
    );
  }

  // Check if players exist and are players (not admins)
  const [player1, player2] = await Promise.all([
    db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, data.player1Id))
      .limit(1),
    db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, data.player2Id))
      .limit(1),
  ]);

  if (!player1.length || !player2.length) {
    throw new Error("Uno o ambos jugadores no existen");
  }

  if (player1[0].role !== "player" || player2[0].role !== "player") {
    throw new Error("Ambos usuarios deben tener el rol de jugador");
  }

  // Check if either player is already in a team
  const existingTeams = await db
    .select({ id: team.id })
    .from(team)
    .where(
      or(
        eq(team.player1Id, data.player1Id),
        eq(team.player2Id, data.player1Id),
        eq(team.player1Id, data.player2Id),
        eq(team.player2Id, data.player2Id)
      )
    );

  if (existingTeams.length > 0) {
    throw new Error("Uno o ambos jugadores ya están en un equipo");
  }

  const [newTeam] = await db
    .insert(team)
    .values({
      player1Id: data.player1Id,
      player2Id: data.player2Id,
      categoryId: data.categoryId,
      status: data.status || "idle",
      wins: 0,
      losses: 0,
    })
    .returning();

  return newTeam;
}

// Update team
export async function updateTeam(teamId: number, data: UpdateTeamData) {
  // Validate if changing players
  if (data.player1Id || data.player2Id) {
    const currentTeam = await db
      .select({ player1Id: team.player1Id, player2Id: team.player2Id })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (!currentTeam.length) {
      throw new Error("Equipo no encontrado");
    }

    const newPlayer1Id = data.player1Id || currentTeam[0].player1Id;
    const newPlayer2Id = data.player2Id || currentTeam[0].player2Id;

    if (newPlayer1Id === newPlayer2Id) {
      throw new Error(
        "No se puede tener el mismo jugador dos veces en un equipo"
      );
    }

    // Check if new players are already in other teams
    if (data.player1Id && data.player1Id !== currentTeam[0].player1Id) {
      const existingTeam = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            or(
              eq(team.player1Id, data.player1Id),
              eq(team.player2Id, data.player1Id)
            ),
            eq(eq(team.id, teamId), false)
          )
        )
        .limit(1);

      if (existingTeam.length > 0) {
        throw new Error("El jugador 1 ya está en otro equipo");
      }
    }

    if (data.player2Id && data.player2Id !== currentTeam[0].player2Id) {
      const existingTeam = await db
        .select({ id: team.id })
        .from(team)
        .where(
          and(
            or(
              eq(team.player1Id, data.player2Id),
              eq(team.player2Id, data.player2Id)
            ),
            eq(eq(team.id, teamId), false)
          )
        )
        .limit(1);

      if (existingTeam.length > 0) {
        throw new Error("El jugador 2 ya está en otro equipo");
      }
    }
  }

  const updateData: Partial<typeof team.$inferInsert> = {};
  if (data.player1Id !== undefined) updateData.player1Id = data.player1Id;
  if (data.player2Id !== undefined) updateData.player2Id = data.player2Id;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

  const [updated] = await db
    .update(team)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(team.id, teamId))
    .returning();

  return updated;
}

// Delete team
export async function deleteTeam(teamId: number) {
  // Check if team has any positions in pyramids
  // This would need to be implemented based on your position table relationships

  const deletedTeam = await db
    .delete(team)
    .where(eq(team.id, teamId))
    .returning();

  if (!deletedTeam.length) {
    throw new Error("Equipo no encontrado");
  }

  return deletedTeam[0];
}

// Get available players (not currently in any team)
export async function getAvailablePlayers() {
  // Get all player users
  const allPlayers = await db
    .select({
      id: users.id,
      paternalSurname: users.paternalSurname,
      maternalSurname: users.maternalSurname,
      email: users.email,
      nickname: profile.nickname,
    })
    .from(users)
    .where(eq(users.role, "player"))
    .leftJoin(profile, eq(users.id, profile.userId));

  // Get all players currently in teams
  const playersInTeams = await db
    .select({
      player1Id: team.player1Id,
      player2Id: team.player2Id,
    })
    .from(team);

  const busyPlayerIds = new Set();
  playersInTeams.forEach((team) => {
    busyPlayerIds.add(team.player1Id);
    busyPlayerIds.add(team.player2Id);
  });

  // Filter out busy players
  const availablePlayers = allPlayers
    .filter((player) => !busyPlayerIds.has(player.id))
    .map((player) => ({
      id: player.id,
      paternalSurname: player.paternalSurname,
      maternalSurname: player.maternalSurname,
      fullName: `${player.paternalSurname} ${player.maternalSurname}`,
      displayName:
        player.nickname ||
        `${player.paternalSurname} ${player.maternalSurname}`,
      email: player.email,
      nickname: player.nickname,
    }));

  return availablePlayers;
}

// Get all players (for reference)
export async function getPlayers() {
  const players = await db
    .select({
      id: users.id,
      paternalSurname: users.paternalSurname,
      maternalSurname: users.maternalSurname,
      email: users.email,
      role: users.role,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
    })
    .from(users)
    .leftJoin(profile, eq(users.id, profile.userId))
    .where(eq(users.role, "player"));

  return players.map((player) => ({
    id: player.id,
    paternalSurname: player.paternalSurname,
    maternalSurname: player.maternalSurname,
    fullName: `${player.paternalSurname} ${player.maternalSurname}`,
    displayName:
      player.nickname || `${player.paternalSurname} ${player.maternalSurname}`,
    email: player.email,
    nickname: player.nickname,
    avatarUrl: player.avatarUrl,
  }));
}

// Get team by ID with full player data
export async function getTeamById(
  teamId: number
): Promise<TeamWithPlayers | null> {
  const teamData = await db
    .select({
      teamId: team.id,
      teamWins: team.wins,
      teamLosses: team.losses,
      teamStatus: team.status,
      teamCategoryId: team.categoryId,
      teamCreatedAt: team.createdAt,
      teamUpdatedAt: team.updatedAt,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
      categoryId: category.id,
      categoryName: category.name,
      categoryDescription: category.description,
    })
    .from(team)
    .where(eq(team.id, teamId))
    .leftJoin(category, eq(team.categoryId, category.id))
    .limit(1);

  if (!teamData.length) {
    return null;
  }

  const data = teamData[0];

  // Get both players' data
  const [player1Data, player2Data] = await Promise.all([
    db
      .select({
        id: users.id,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        email: users.email,
        nickname: profile.nickname,
      })
      .from(users)
      .where(eq(users.id, data.player1Id))
      .leftJoin(profile, eq(users.id, profile.userId))
      .limit(1),
    db
      .select({
        id: users.id,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        email: users.email,
        nickname: profile.nickname,
      })
      .from(users)
      .where(eq(users.id, data.player2Id))
      .leftJoin(profile, eq(users.id, profile.userId))
      .limit(1),
  ]);

  if (!player1Data.length || !player2Data.length) {
    return null;
  }

  const player1 = {
    id: player1Data[0].id,
    paternalSurname: player1Data[0].paternalSurname,
    maternalSurname: player1Data[0].maternalSurname,
    fullName: `${player1Data[0].paternalSurname} ${player1Data[0].maternalSurname}`,
    nickname: player1Data[0].nickname,
    email: player1Data[0].email,
  };

  const player2 = {
    id: player2Data[0].id,
    paternalSurname: player2Data[0].paternalSurname,
    maternalSurname: player2Data[0].maternalSurname,
    fullName: `${player2Data[0].paternalSurname} ${player2Data[0].maternalSurname}`,
    nickname: player2Data[0].nickname,
    email: player2Data[0].email,
  };

  return {
    id: data.teamId,
    displayName: getTeamDisplayName(player1, player2),
    wins: data.teamWins || 0,
    losses: data.teamLosses || 0,
    status: data.teamStatus || "idle",
    categoryId: data.teamCategoryId,
    category: data.categoryId
      ? {
          id: data.categoryId,
          name: data.categoryName!,
          description: data.categoryDescription,
        }
      : null,
    player1,
    player2,
    createdAt: data.teamCreatedAt,
    updatedAt: data.teamUpdatedAt,
  };
}

// Check if a user is part of any team
export async function getUserTeams(userId: string) {
  const userTeams = await db
    .select({
      id: team.id,
      player1Id: team.player1Id,
      player2Id: team.player2Id,
    })
    .from(team)
    .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)));

  return userTeams;
}
