"use server"
import { users, profile } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { getUserDisplayName } from "@/lib/utils";
import { eq } from "drizzle-orm";

// Get players available for team formation (not currently in a team for specific pyramid)
export async function getAvailablePlayers(): Promise<UserWithProfile[]> {
  // Base query for players
  const query = db
    .select({
      id: users.id,
      email: users.email,
      paternalSurname: users.paternalSurname,
      maternalSurname: users.maternalSurname,
      role: users.role,
      profileNickname: profile.nickname,
      profileAvatarUrl: profile.avatarUrl,
    })
    .from(users)
    .leftJoin(profile, eq(users.id, profile.userId))
    .where(eq(users.role, "player"))
    .orderBy(users.paternalSurname, users.maternalSurname);

  // If pyramid specified, filter out players already in teams in that pyramid
  // This would require additional logic based on your team/position relationships

  const rows = await query;

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    paternalSurname: row.paternalSurname,
    maternalSurname: row.maternalSurname,
    fullName: getUserDisplayName(row.paternalSurname, row.maternalSurname),
    displayName: getUserDisplayName(
      row.paternalSurname,
      row.maternalSurname,
      row.profileNickname
    ),
    role: row.role,
    profile: {
      nickname: row.profileNickname,
      avatarUrl: row.profileAvatarUrl,
    },
  }));
}