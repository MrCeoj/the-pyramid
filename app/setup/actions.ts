"use server";

import { db } from "@/lib/drizzle";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export async function createProfile(data: CreateProfileData) {
  try {
    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, data.userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return { success: false, error: "El perfil ya existe" };
    }

    // Check if nickname is already taken (if provided)
    if (data.nickname) {
      const nicknameExists = await db
        .select()
        .from(profile)
        .where(eq(profile.nickname, data.nickname))
        .limit(1);

      if (nicknameExists.length > 0) {
        return { success: false, error: "Este apodo ya está en uso" };
      }
    }

    // Create the profile
    const [newProfile] = await db
      .insert(profile)
      .values({
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
      })
      .returning();

    revalidatePath("/");
    
    return { success: true, profile: newProfile };
  } catch (error) {
    console.error("Error creating profile:", error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("nickname")) {
      return { success: false, error: "Este apodo ya está en uso" };
    }
    
    return { success: false, error: "Error al crear el perfil" };
  }
}