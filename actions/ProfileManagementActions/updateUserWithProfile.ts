"use server"
import { users, profile } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq, and, ne } from "drizzle-orm";

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
