"use server"
import { users, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";

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