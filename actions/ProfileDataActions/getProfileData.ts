"use server";
import { users, profile } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { getUserDisplayName } from "@/lib/utils";

export async function getProfileData(userId: string): Promise<ProfileData> {
  try {
    // Get user data with updated fields
    const userData = await db
      .select({
        id: users.id,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      throw new Error("User not found");
    }

    const user = userData[0];
    let userProfile = null;

    // Get profile data only if user is a player
    if (user.role === "player") {
      const profileData = await db
        .select({
          nickname: profile.nickname,
          avatarUrl: profile.avatarUrl,
        })
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1);

      userProfile = profileData[0] || { nickname: null, avatarUrl: null };
    }

    return {
      user: {
        paternalSurname: user.paternalSurname,
        maternalSurname: user.maternalSurname,
        email: user.email,
        role: user.role,
        fullName: getUserDisplayName(
          user.paternalSurname,
          user.maternalSurname,
        ),
      },
      profile: userProfile,
    };
  } catch (error) {
    console.error("Error al procesar usuario:", error);
    throw new Error("Error al procesar usuario.");
  }
}
