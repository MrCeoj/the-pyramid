"use server"
import { users, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import bcrypt from "bcryptjs";

export async function createNewUserAndProfile(data: NewUserData) {
  try {
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

    const normalizedEmail = data.email.trim().toLowerCase();
    const role = "player";

    // Check if already registered
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Este correo ya está registrado.");
    }

    return await db.transaction(async (tx) => {
      // 1) Create user
      const passwordHash = await bcrypt.hash(data.password, 10);
      const [newUser] = await tx
        .insert(users)
        .values({
          name: data.paternalSurname.trim() + " " + data.maternalSurname.trim(),
          paternalSurname: data.paternalSurname.trim(),
          maternalSurname: data.maternalSurname.trim(),
          email: normalizedEmail,
          passwordHash,
          role,
        })
        .returning();

      // 2) Create profile only if player
      if (role === "player") {
        await tx.insert(profile).values({
          userId: newUser.id,
          nickname: data.nickname?.trim() || null,
        });
      }

      return { success: true, data: newUser, error: null };
    });
  } catch (error) {
    if (error instanceof Error)
      return { success: false, data: null, error: error.message };
    else return { success: false, data: null, error: null };
  }
}