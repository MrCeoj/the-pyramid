"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq, or, like } from "drizzle-orm";
import { getUserDisplayName } from "@/lib/utils";

export async function searchUsersBySurname(
  searchTerm: string,
  limit: number = 10,
) {
  try {
    // Search in both paternal and maternal surnames
    const user = await db
      .select({
        id: users.id,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        email: users.email,
        role: users.role,
        nickname: profile.nickname,
      })
      .from(users)
      .leftJoin(profile, eq(profile.userId, users.id))
      .where(
        or(
          like(users.paternalSurname, `%${searchTerm}%`),
          like(users.maternalSurname, `%${searchTerm}%`),
          like(profile.nickname, `%${searchTerm}%`),
        ),
      )
      .limit(limit);

    return user.map((user) => ({
      id: user.id,
      fullName: getUserDisplayName(user.paternalSurname, user.maternalSurname),
      displayName: getUserDisplayName(
        user.paternalSurname,
        user.maternalSurname,
        user.nickname,
      ),
      email: user.email,
      role: user.role,
      nickname: user.nickname,
    }));
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}