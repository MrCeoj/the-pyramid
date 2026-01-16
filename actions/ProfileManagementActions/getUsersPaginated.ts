"use server"
import { users, profile } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, sql, desc, or, ilike } from "drizzle-orm";
import { getUserDisplayName } from "@/lib/utils";

// Paginated + search with updated fields
export async function getUsersPaginated(
  page: number,
  pageSize: number,
  search?: string
): Promise<{
  userArray: UserWithProfile[];
  total: number;
  totalPages: number;
}> {
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? or(
        ilike(users.paternalSurname, `%${search}%`),
        ilike(users.maternalSurname, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(profile.nickname, `%${search}%`)
      )
    : undefined;

  const [rows, totalResult] = await Promise.all([
    db
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
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(users.role), users.paternalSurname, users.maternalSurname),

    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(profile, eq(users.id, profile.userId))
      .where(whereClause),
  ]);

  const total = Number(totalResult[0].count);
  const totalPages = Math.ceil(total / pageSize);

  const userArray = rows.map((row) => ({
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

  return {
    userArray,
    total,
    totalPages,
  };
}