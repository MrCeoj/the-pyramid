"use server";
import { db } from "@/lib/drizzle";
import { team, profile, category, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Fetch all teams + players + category
export async function getTeams() {
  const teams = await db
    .select()
    .from(team)
    .leftJoin(category, eq(team.categoryId, category.id));

  const players = await db
    .select()
    .from(profile)
    .leftJoin(users, eq(profile.userId, users.id));

  // Join players into teams
  const teamsWithPlayers = teams.map((t) => ({
    ...t,
    players: players.filter((p) => p.profile.teamId === t.team.id),
  }));

  return teamsWithPlayers;
}

// Fetch categories
export async function getCategories() {
  return await db.select().from(category);
}

// Create team
export async function createTeam(data: {
  name?: string;
  categoryId: number;
  status?: "idle" | "winner" | "looser" | "risky";
}) {
  const [newTeam] = await db
    .insert(team)
    .values({
      name: data.name ?? "",
      categoryId: data.categoryId,
      status: data.status ?? "idle",
    })
    .returning();
  return newTeam;
}

// Update team
export async function updateTeam(
  teamId: number,
  data: Partial<typeof team.$inferInsert>
) {
  const [updated] = await db
    .update(team)
    .set({
      name: data.name,
      status: data.status,
      categoryId: data.categoryId,
    })
    .where(eq(team.id, teamId))
    .returning();
  return updated;
}

// Delete team
export async function deleteTeam(teamId: number) {
  await db.delete(team).where(eq(team.id, teamId));
}

// Add player to team
export async function addPlayerToTeam(teamId: number, playerId: number) {
  // Check team capacity (max 2)
  const players = await db
    .select()
    .from(profile)
    .where(eq(profile.teamId, teamId));
  if (players.length >= 2) {
    throw new Error("Team already has 2 players");
  }

  const [updated] = await db
    .update(profile)
    .set({ teamId })
    .where(eq(profile.id, playerId))
    .returning();
  return updated;
}

// Remove player from team
export async function removePlayerFromTeam(playerId: number) {
  const [updated] = await db
    .update(profile)
    .set({ teamId: null })
    .where(eq(profile.id, playerId))
    .returning();
  return updated;
}

export async function getPlayers() {
  return await db
    .select()
    .from(profile)
    .leftJoin(users, eq(profile.userId, users.id))
}
