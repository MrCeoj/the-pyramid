"use server"
import { users, profile } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { getUserDisplayName } from "@/lib/utils";
import { eq } from "drizzle-orm";

// Get users by role
export async function getUsersByRole(
  role: "player" | "admin"
): Promise<UserWithProfile[]> {
  const rows = await db
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
    .where(eq(users.role, role))
    .orderBy(users.paternalSurname, users.maternalSurname);

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