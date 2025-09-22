"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq, sql, desc, or, ilike } from "drizzle-orm";

// Get all users with their profile
export async function getUsers() {
  return await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      profile: {
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
      },
    })
    .from(users)
    .leftJoin(profile, eq(users.id, profile.userId));
}

// Create user + profile automatically
export async function createUserWithProfile(data: {
  name: string;
  email: string;
  role: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
  };
}) {
  const [newUser] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      role: data.role === "admin" ? "admin" : "player",
    })
    .returning();

  await db.insert(profile).values({
    userId: newUser.id,
    nickname: data.profile?.nickname || null,
    avatarUrl: data.profile?.avatarUrl || null,
  });

  return newUser;
}

// Paginated + search
export async function getUsersPaginated(
  page: number,
  pageSize: number,
  search?: string
) {
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(profile.nickname, `%${search}%`)
      )
    : undefined;

  const [rows, total] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        profile: {
          nickname: profile.nickname,
          avatarUrl: profile.avatarUrl,
        },
      })
      .from(users)
      .leftJoin(profile, eq(users.id, profile.userId))
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(users.role)),

    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(profile, eq(users.id, profile.userId))
      .where(whereClause),
  ]);

  return {
    users: rows,
    total: Number(total[0].count),
  };
}

// Update user + profile (except password)
export async function updateUserWithProfile(
  userId: string,
  data: {
    name: string;
    email: string;
    role: string;
    profile?: {
      nickname?: string;
      avatarUrl?: string;
    };
  }
) {
  await db
    .update(users)
    .set({
      name: data.name,
      email: data.email,
      role: data.role === "admin" ? "admin" : "player",
    })
    .where(eq(users.id, userId));

  await db
    .update(profile)
    .set({
      nickname: data.profile?.nickname || null,
      avatarUrl: data.profile?.avatarUrl || null,
    })
    .where(eq(profile.userId, userId));
}
