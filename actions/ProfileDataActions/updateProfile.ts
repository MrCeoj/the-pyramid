"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(data: UpdateProfileData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    await db.transaction(async (tx) => {
      const userUpdateData: Partial<typeof users.$inferInsert> = {};

      // Validation for required fields
      if (data.paternalSurname === "") {
        throw new Error("El apellido paterno es obligatorio.");
      }
      if (data.maternalSurname === "") {
        throw new Error("El apellido materno es obligatorio.");
      }
      if (data.email === "") {
        throw new Error("El correo es obligatorio.");
      }

      // Update user fields
      if (data.paternalSurname !== undefined) {
        userUpdateData.paternalSurname = data.paternalSurname;
      }
      if (data.maternalSurname !== undefined) {
        userUpdateData.maternalSurname = data.maternalSurname;
      }
      if (data.email !== undefined) {
        userUpdateData.email = data.email;
      }
      if (data.image !== undefined) {
        userUpdateData.image = data.image;
      }

      // Handle password change
      if (data.currentPassword && data.newPassword && data.confirmPassword) {
        if (data.newPassword !== data.confirmPassword) {
          throw new Error("Las nuevas contraseñas no coinciden.");
        }

        // Get current password hash
        const [user] = await tx
          .select({ passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) throw new Error("Usuario no encontrado.");

        if (!user.passwordHash) {
          throw new Error("El usuario no ha ingresado su contraseña inicial.");
        }

        const isMatch = await bcrypt.compare(
          data.currentPassword,
          user.passwordHash,
        );

        if (!isMatch) {
          throw new Error("La contraseña actual es incorrecta.");
        }

        console.debug("Password match");

        const sameAsBefore = await bcrypt.compare(
          data.newPassword,
          user.passwordHash,
        );

        if (sameAsBefore) {
          throw new Error(
            "La nueva contraseña no puede ser igual a la actual.",
          );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        userUpdateData.passwordHash = hashedPassword;
      }

      // Update user table
      if (Object.keys(userUpdateData).length > 0) {
        await tx.update(users).set(userUpdateData).where(eq(users.id, userId));
      }

      // Update or create profile if player
      if (userRole === "player") {
        const profileUpdateData: Partial<typeof profile.$inferInsert> = {};

        if (data.nickname !== undefined) {
          profileUpdateData.nickname = data.nickname;
        }
        if (data.avatarUrl !== undefined) {
          profileUpdateData.avatarUrl = data.avatarUrl;
        }

        if (Object.keys(profileUpdateData).length > 0) {
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
                ...profileUpdateData,
                updatedAt: new Date(),
              })
              .where(eq(profile.userId, userId));
          } else {
            // Create new profile
            await tx.insert(profile).values({
              userId,
              nickname: data.nickname || null,
              avatarUrl: data.avatarUrl || null,
            });
          }
        }
      }
    });

    // Revalidate pages that might show profile data
    revalidatePath("/");

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Hubo un error al actualizar el perfil.",
    };
  }
}
