"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq, sql, or, ilike } from "drizzle-orm";
import { getUserDisplayName } from "@/lib/utils";


// Search users with advanced options
export async function searchUsers(options: {
  search?: string;
  role?: "player" | "admin";
  hasNickname?: boolean;
  limit?: number;
}): Promise<UserWithProfile[]> {
  const { search, role, hasNickname, limit = 50 } = options;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(users.paternalSurname, `%${search}%`),
        ilike(users.maternalSurname, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(profile.nickname, `%${search}%`)
      )
    );
  }

  if (role) {
    conditions.push(eq(users.role, role));
  }

  if (hasNickname !== undefined) {
    if (hasNickname) {
      conditions.push(
        sql`${profile.nickname} IS NOT NULL AND ${profile.nickname} != ''`
      );
    } else {
      conditions.push(
        sql`${profile.nickname} IS NULL OR ${profile.nickname} = ''`
      );
    }
  }

  const whereClause =
    conditions.length > 0
      ? sql`${conditions.reduce((acc, condition, index) =>
          index === 0 ? condition : sql`${acc} AND ${condition}`
        )}`
      : undefined;

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
    .where(whereClause)
    .limit(limit)
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
