"use server";

import { db } from "@/lib/drizzle"; // Assuming your db instance is here
import {
  team,
  users,
  profile,
  category,
  getTeamDisplayName,
} from "@/db/schema"; // Assuming your schema is here
import { eq, aliasedTable } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type TeamWithPlayers = {
  team: typeof team.$inferSelect;
  category: typeof category.$inferSelect | null;
  player1: {
    user: typeof users.$inferSelect;
    profile: typeof profile.$inferSelect | null;
  } | null; // 👈 ahora acepta null
  player2: {
    user: typeof users.$inferSelect;
    profile: typeof profile.$inferSelect | null;
  } | null; // 👈 ahora acepta null
  displayName: string;
};

/**
 * Fetches all teams with their associated players, profiles, and categories.
 */
export async function getTeams(): Promise<TeamWithPlayers[]> {
  try {
    const user1 = aliasedTable(users, "user1");
    const user2 = aliasedTable(users, "user2");
    const profile1 = aliasedTable(profile, "profile1");
    const profile2 = aliasedTable(profile, "profile2");

    const teamsData = await db
      .select({
        team,
        category,
        user1,
        profile1,
        user2,
        profile2,
      })
      .from(team)
      .leftJoin(category, eq(team.categoryId, category.id))
      .leftJoin(user1, eq(team.player1Id, user1.id))
      .leftJoin(profile1, eq(user1.id, profile1.userId))
      .leftJoin(user2, eq(team.player2Id, user2.id))
      .leftJoin(profile2, eq(user2.id, profile2.userId));

    const structuredTeams = teamsData.map((row) => {
      const player1User = row.user1 as typeof users.$inferSelect | null;
      const player2User = row.user2 as typeof users.$inferSelect | null;

      const player1Profile = row.profile1 ?? null;
      const player2Profile = row.profile2 ?? null;

      const p1 = player1User
        ? { user: player1User, profile: player1Profile }
        : null;

      const p2 = player2User
        ? { user: player2User, profile: player2Profile }
        : null;

      const displayName = getTeamDisplayName(
        p1
          ? {
              id: p1.user.id,
              paternalSurname: p1.user.paternalSurname,
              maternalSurname: p1.user.maternalSurname,
              nickname: p1.profile?.nickname,
            }
          : null,
        p2
          ? {
              id: p2.user.id,
              paternalSurname: p2.user.paternalSurname,
              maternalSurname: p2.user.maternalSurname,
              nickname: p2.profile?.nickname,
            }
          : null
      );

      return {
        team: row.team,
        category: row.category,
        player1: p1,
        player2: p2,
        displayName,
      };
    });

    // Deduplicate teams since the joins can result in multiple rows per team
    const uniqueTeams = Array.from(
      new Map(structuredTeams.map((t) => [t.team.id, t])).values()
    );

    return uniqueTeams;
  } catch (error) {
    console.error("Failed to get teams:", error);
    throw new Error("Could not fetch teams.");
  }
}

/**
 * Fetches all categories.
 */
export async function getCategories() {
  try {
    const categories = await db.select().from(category);
    return categories.sort((a, b) => {
      return a.id - b.id;
    });
  } catch (error) {
    console.error("Failed to get categories:", error);
    throw new Error("Could not fetch categories.");
  }
}

/**
 * Fetches all users who can be players.
 */
export async function getPlayers() {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        email: users.email,
        nickname: profile.nickname,
      })
      .from(profile)
      .leftJoin(users, eq(users.id, profile.userId));

  } catch (error) {
    console.error("Failed to get players:", error);
    throw new Error("Could not fetch players.");
  }
}

/**
 * Creates a new team with two specified players.
 */
export async function createTeam(data: {
  player1Id: string;
  player2Id: string;
  categoryId: number;
}) {
  if (data.player1Id === data.player2Id) {
    throw new Error("Un equipo debe tener dos miembros distintos.");
  }

  try {
    const newTeam = await db
      .insert(team)
      .values({
        player1Id: data.player1Id || null,
        player2Id: data.player2Id || null,
        categoryId: data.categoryId,
        status: "idle",
      })
      .returning();

    revalidatePath("/equipos");
    return newTeam[0];
  } catch (error) {
    console.error("Failed to create team:", error);
    if (error instanceof Error)
      if (error.message.includes("unique_team_players")) {
        throw new Error("A team with these two players already exists.");
      }
    throw new Error("No se pudo crear el equipo.");
  }
}

/**
 * Updates a team's category or status.
 */
export async function updateTeam(
  teamId: number,
  data: { categoryId?: number; status?: "looser" | "winner" | "idle" | "risky" }
) {
  try {
    const updatedTeam = await db
      .update(team)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(team.id, teamId))
      .returning();

    revalidatePath("/equipos");
    return updatedTeam[0];
  } catch (error) {
    console.error("Failed to update team:", error);
    throw new Error("Could not update the team.");
  }
}

/**
 * Updates a team's players.
 */
export async function updateTeamPlayers(
  teamId: number,
  data: { player1Id?: string | null; player2Id?: string | null }
) {
  // Validate that if both players are provided, they are different
  if (data.player1Id && data.player2Id && data.player1Id === data.player2Id) {
    throw new Error("Los jugadores no pueden ser la misma persona.");
  }

  // Validate that at least one player is provided or explicitly set to null
  if (data.player1Id === "" && data.player2Id === "") {
    throw new Error("Un equipo debe tener al menos un jugador.");
  }

  try {
    const updateData: { player1Id?: string | null; player2Id?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (data.player1Id !== undefined) {
      updateData.player1Id = data.player1Id || null;
    }

    if (data.player2Id !== undefined) {
      updateData.player2Id = data.player2Id || null;
    }

    const updatedTeam = await db
      .update(team)
      .set(updateData)
      .where(eq(team.id, teamId))
      .returning();

    revalidatePath("/equipos");
    return updatedTeam[0];
  } catch (error) {
    console.error("Failed to update team players:", error);
    if (error instanceof Error && error.message.includes("unique_team_players")) {
      throw new Error("Ya existe un equipo con estos jugadores.");
    }
    throw new Error("No se pudieron actualizar los jugadores del equipo.");
  }
}

/**
 * Deletes a team.
 */
export async function deleteTeam(teamId: number) {
  try {
    await db.delete(team).where(eq(team.id, teamId));
    revalidatePath("/equipos");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    throw new Error("Could not delete the team.");
  }
}