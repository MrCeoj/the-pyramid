"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq, sql, desc, or, ilike, ne, and } from "drizzle-orm";

// Helper function to generate full name
function getFullName(paternalSurname: string, maternalSurname: string): string {
  return `${paternalSurname} ${maternalSurname}`;
}

// Helper function to get display name (nickname or full name)
function getDisplayName(
  paternalSurname: string,
  maternalSurname: string,
  nickname?: string | null
): string {
  return nickname || getFullName(paternalSurname, maternalSurname);
}

export interface UserWithProfile {
  id: string;
  email: string | null;
  paternalSurname: string;
  maternalSurname: string;
  fullName: string;
  displayName: string;
  role: "player" | "admin";
  profile: {
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface CreateUserData {
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  role: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface UpdateUserData {
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  role: string;
  profile?: {
    nickname?: string;
    avatarUrl?: string;
  };
}

// Get all users with their profile
export async function getUsers(): Promise<UserWithProfile[]> {
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
    .orderBy(users.paternalSurname, users.maternalSurname);

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    paternalSurname: row.paternalSurname,
    maternalSurname: row.maternalSurname,
    fullName: getFullName(row.paternalSurname, row.maternalSurname),
    displayName: getDisplayName(
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

// Create user + profile automatically
export async function createUserWithProfile(data: CreateUserData) {
  // Validate required fields
  if (!data.paternalSurname?.trim()) {
    throw new Error("El apellido paterno es obligatorio");
  }
  if (!data.maternalSurname?.trim()) {
    throw new Error("El apellido materno es obligatorio");
  }
  if (!data.email?.trim()) {
    throw new Error("El correo electrónico es obligatorio");
  }

  return await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        name: data.paternalSurname.trim() + " " + data.maternalSurname.trim(),
        paternalSurname: data.paternalSurname.trim(),
        maternalSurname: data.maternalSurname.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role === "admin" ? "admin" : "player",
      })
      .returning();

    // Create profile only if user is a player
    if (newUser.role === "player") {
      await tx.insert(profile).values({
        userId: newUser.id,
        nickname: data.profile?.nickname?.trim() || null,
        avatarUrl: data.profile?.avatarUrl || null,
      });
    }

    return newUser;
  });
}

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
    fullName: getFullName(row.paternalSurname, row.maternalSurname),
    displayName: getDisplayName(
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

// Update user + profile (except password)
export async function updateUserWithProfile(
  userId: string,
  data: UpdateUserData
) {
  // Validate required fields
  if (!data.paternalSurname?.trim()) {
    throw new Error("El apellido paterno es obligatorio");
  }
  if (!data.maternalSurname?.trim()) {
    throw new Error("El apellido materno es obligatorio");
  }
  if (!data.email?.trim()) {
    throw new Error("El correo electrónico es obligatorio");
  }

  const prevEmail = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.email, data.email.trim()), ne(users.id, userId)));

  if (prevEmail.length > 0)
    throw new Error("Ese correo ya esta inscrito en otro perfil");

  return await db.transaction(async (tx) => {
    // Update user table
    await tx
      .update(users)
      .set({
        paternalSurname: data.paternalSurname.trim(),
        maternalSurname: data.maternalSurname.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role === "admin" ? "admin" : "player",
      })
      .where(eq(users.id, userId));

    // Handle profile based on role
    const newRole = data.role === "admin" ? "admin" : "player";

    if (newRole === "player") {
      // Check if profile exists
      const existingProfile = await tx
        .select({ id: profile.id })
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1);

      if (existingProfile.length > 0) {
        // Update existing profile
        await tx
          .update(profile)
          .set({
            nickname: data.profile?.nickname?.trim() || null,
            avatarUrl: data.profile?.avatarUrl || null,
            updatedAt: new Date(),
          })
          .where(eq(profile.userId, userId));
      } else {
        // Create new profile for new player
        await tx.insert(profile).values({
          userId,
          nickname: data.profile?.nickname?.trim() || null,
          avatarUrl: data.profile?.avatarUrl || null,
        });
      }
    } else {
    }
  });
}

// Delete user and associated data
export async function deleteUser(userId: string) {
  return await db.transaction(async (tx) => {
    // Profile will be deleted automatically due to cascade delete in schema
    // Team associations will be handled by your application logic

    const deletedUser = await tx
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    return deletedUser[0];
  });
}

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
    fullName: getFullName(row.paternalSurname, row.maternalSurname),
    displayName: getDisplayName(
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
    fullName: getFullName(row.paternalSurname, row.maternalSurname),
    displayName: getDisplayName(
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
    fullName: getFullName(row.paternalSurname, row.maternalSurname),
    displayName: getDisplayName(
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
