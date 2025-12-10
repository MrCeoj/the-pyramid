"use server";
import { unstable_update } from "@/lib/auth";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { CreateProfileData } from "./types";

export async function updateProfile(data: CreateProfileData) {
  try {
    const existingProfile = await db
      .select({ id: profile.userId })
      .from(profile)
      .where(eq(profile.userId, data.userId))
      .limit(1);

    if (existingProfile.length === 0)
      return {
        success: false,
        error: "No existe ningun perfil registrado.",
      };

    let passwordHash = undefined;
    if (data.password && data.password.length > 0) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    await db.transaction(async (tx) => {
      await tx
        .update(profile)
        .set({
          nickname: data.nickname,
          avatarUrl: data.avatarUrl,
        })
        .where(eq(profile.userId, existingProfile[0].id));

      await tx
        .update(users)
        .set({ passwordHash: passwordHash })
        .where(eq(users.id, data.userId));
    });

    await unstable_update({
      user: {
        hasProfile: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile or user:", error);
    return {
      success: false,
      error: "Error al crear el perfil o actualizar el usuario.",
    };
  }
}
