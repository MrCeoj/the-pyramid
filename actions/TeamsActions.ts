"use server";

import { db } from "@/lib/drizzle"; // Assuming your db instance is here
import { sendRiskyWarningMail } from "@/actions/MailActions";
import { getTeamWithPlayers } from "@/actions/matches/TeamService";
import { eq, aliasedTable, and, gte, or, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  team,
  users,
  profile,
  category,
  getTeamDisplayName,
  position,
  pyramid,
  match,
} from "@/db/schema";

export type TeamWithPlayers = {
  team: typeof team.$inferSelect;
  category: typeof category.$inferSelect | null;
  player1: {
    user: typeof users.$inferSelect;
    profile: typeof profile.$inferSelect | null;
  } | null;
  player2: {
    user: typeof users.$inferSelect;
    profile: typeof profile.$inferSelect | null;
  } | null;
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
    throw new Error("No se pudo conseguir a los equipos.");
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
  data: {
    categoryId?: number;
    status?: "looser" | "winner" | "idle" | "risky";
    lastResult?: "up" | "down" | "stayed" | "none";
    defendable?: boolean;
    loosingStreak?: number;
  }
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
    const updateData: {
      player1Id?: string | null;
      player2Id?: string | null;
      updatedAt: Date;
    } = {
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
    if (
      error instanceof Error &&
      error.message.includes("unique_team_players")
    ) {
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

export interface RiskyCheckResult {
  success: boolean;
  message: string;
  teamsMarkedRisky: number;
  emailsSent: number;
  emailsFailed: number;
  details?: {
    riskyTeams: string[];
    emailResults: unknown[];
  };
}

export async function checkAndMarkRiskyTeams(
  pyramidId: number
): Promise<RiskyCheckResult> {
  try {
    const [pyramidRowsTotal] = await db
      .select({ row_amount: pyramid.row_amount })
      .from(pyramid)
      .where(eq(pyramid.id, pyramidId));

    if (!pyramidRowsTotal)
      throw new Error("Error al conseguir la cantidad de filas de la pirámide");

    const prevMonday = await getPreviousMonday();
    const currMonday = await getPreviousMonday(false);

    const teamsInPyramid = await db
      .select({
        teamId: position.teamId,
        row: position.row,
        col: position.col,
      })
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          ne(position.row, pyramidRowsTotal.row_amount!)
        )
      );

    if (teamsInPyramid.length === 0) {
      return {
        success: false,
        message: "No se encontraron equipos en la pirámide",
        teamsMarkedRisky: 0,
        emailsSent: 0,
        emailsFailed: 0,
      };
    }

    const allTeamIds = teamsInPyramid.map((t) => t.teamId);

    // Get matches from current week (since currMonday)
    const currentWeekMatches = await db
      .selectDistinct({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(
        and(
          eq(match.pyramidId, pyramidId),
          eq(match.status, "played"),
          gte(match.updatedAt, currMonday), // Current week
          or(
            inArray(match.challengerTeamId, allTeamIds),
            inArray(match.defenderTeamId, allTeamIds)
          )
        )
      );

    // Get matches from previous week (between prevMonday and currMonday)
    const previousWeekMatches = await db
      .selectDistinct({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(
        and(
          eq(match.pyramidId, pyramidId),
          eq(match.status, "played"),
          gte(match.updatedAt, prevMonday),
          lt(match.updatedAt, currMonday), // Previous week only
          or(
            inArray(match.challengerTeamId, allTeamIds),
            inArray(match.defenderTeamId, allTeamIds)
          )
        )
      );

    // Count matches per team for current week
    const currentWeekCounts = new Map<number, number>();
    currentWeekMatches.forEach((m) => {
      currentWeekCounts.set(
        m.challengerTeamId,
        (currentWeekCounts.get(m.challengerTeamId) || 0) + 1
      );
      currentWeekCounts.set(
        m.defenderTeamId,
        (currentWeekCounts.get(m.defenderTeamId) || 0) + 1
      );
    });

    // Count matches per team for previous week
    const previousWeekCounts = new Map<number, number>();
    previousWeekMatches.forEach((m) => {
      previousWeekCounts.set(
        m.challengerTeamId,
        (previousWeekCounts.get(m.challengerTeamId) || 0) + 1
      );
      previousWeekCounts.set(
        m.defenderTeamId,
        (previousWeekCounts.get(m.defenderTeamId) || 0) + 1
      );
    });

    const activeTeamIds = new Set<number>();

    allTeamIds.forEach((teamId) => {
      const currentWeekMatchCount = currentWeekCounts.get(teamId) || 0;
      const previousWeekMatchCount = previousWeekCounts.get(teamId) || 0;

      if (currentWeekMatchCount >= 1 || previousWeekMatchCount >= 2) {
        activeTeamIds.add(teamId);
      }
    });

    // Step 3: Find inactive teams (teams that haven't played)
    const inactiveTeamIds = allTeamIds.filter(
      (teamId) => !activeTeamIds.has(teamId)
    );

    if (inactiveTeamIds.length === 0) {
      return {
        success: true,
        message: "Todos los equipos han sido activos esta semana. ¡Excelente!",
        teamsMarkedRisky: 0,
        emailsSent: 0,
        emailsFailed: 0,
      };
    }

    // Step 4: Mark inactive teams as "risky"
    await db
      .update(team)
      .set({
        status: "risky",
        updatedAt: new Date(),
      })
      .where(inArray(team.id, inactiveTeamIds));

    // Step 5: Get full team data and send warning emails
    const emailResults = [];
    let emailsSent = 0;
    let emailsFailed = 0;
    const riskyTeamNames = [];

    for (const teamId of inactiveTeamIds) {
      try {
        const teamData = await getTeamWithPlayers(teamId);
        if (!teamData) {
          console.warn(`Could not fetch data for team ID: ${teamId}`);
          continue;
        }

        riskyTeamNames.push(teamData.displayName);

        // Get team position for email context
        const teamPosition = teamsInPyramid.find((t) => t.teamId === teamId);

        const nextRowPosition = teamPosition!.row + 1;

        // Send warning email
        const emailResult = await sendRiskyWarningMail(
          teamData,
          pyramidId,
          teamPosition?.row,
          nextRowPosition
        );

        emailResults.push({
          teamName: teamData.displayName,
          result: emailResult,
        });

        if (emailResult.success) {
          emailsSent += emailResult.emailsSent || 0;
          emailsFailed += emailResult.emailsFailed || 0;
        } else {
          emailsFailed += 2;
        }
      } catch (error) {
        console.error(`Error processing team ${teamId}:`, error);
        emailsFailed += 2;
      }
    }

    revalidatePath("/admin");
    revalidatePath("/piramide");

    return {
      success: true,
      message: `Se marcaron ${inactiveTeamIds.length} equipos como "en riesgo" y se enviaron ${emailsSent} emails de advertencia.`,
      teamsMarkedRisky: inactiveTeamIds.length,
      emailsSent,
      emailsFailed,
      details: {
        riskyTeams: riskyTeamNames,
        emailResults,
      },
    };
  } catch (error) {
    console.error("Error checking risky teams:", error);
    return {
      success: false,
      message: "Error al verificar equipos inactivos. Intenta de nuevo.",
      teamsMarkedRisky: 0,
      emailsSent: 0,
      emailsFailed: 0,
    };
  }
}

export async function getPreviousMonday(
  previous = true,
  date: Date = new Date()
): Promise<Date> {
  const d = new Date(date);
  const day = d.getDay();
  let diff;
  if (previous) {
    diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7; // -7 because one week offset
  } else {
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  }

  d.setHours(0, 0, 0, 0);
  d.setDate(diff);
  return d;
}
