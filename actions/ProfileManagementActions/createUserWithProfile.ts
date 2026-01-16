"use server"
import { users, profile } from "@/db/schema";
import { db } from "@/lib/drizzle";

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