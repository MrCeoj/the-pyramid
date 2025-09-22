"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UpdateProfileData {
  // User fields
  name?: string;
  email?: string;
  image?: string;
  nickname?: string;
  avatarUrl?: string;

  // Password fields (optional)
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export async function getProfileData(userId: string) {
  try {
    // Get user data
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
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
        })
        .from(profile)
        .where(eq(profile.userId, userId))
        .limit(1);

      userProfile = profileData[0] || null;
    }

    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile: userProfile,
    };
  } catch (error) {
    console.error("Error al procesar usuario:", error);
    throw new Error("Error al procesar usuario.");
  }
}

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
      if (data.name === "") throw new Error("El nombre es obligatorio.")
      if (data.email === "") throw new Error("El correo es obligatorio")
      if (data.name !== undefined) userUpdateData.name = data.name;
      if (data.email !== undefined) userUpdateData.email = data.email;

      // ✅ Handle password change
      if (data.currentPassword && data.newPassword && data.confirmPassword) {
        if (data.newPassword !== data.confirmPassword) {
          throw new Error("Las nuevas contraseñas no coinciden.");
        }
        console.log("handling passwords")

        // Get current password hash
        const [user] = await tx
          .select({ passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) throw new Error("Usuario no encontrado.");

        if(!user.passwordHash) throw new Error("El usuario no ha ingresado su contraseña inicial.")
        
        const isMatch = await bcrypt.compare(
          data.currentPassword,
          user.passwordHash
        );

        if (!isMatch) throw new Error("La contraseña actual es incorrecta.");
        console.debug("Password match")

        const sameAsBefore = await bcrypt.compare(
            data.newPassword,
            user.passwordHash
        )

        if (sameAsBefore) throw new Error("La nueva contraseña no puede ser igual a la actual.")
        // Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        userUpdateData.passwordHash = hashedPassword;
      }

      // ✅ Update user table
      if (Object.keys(userUpdateData).length > 0) {
        await tx
          .update(users)
          .set(userUpdateData)
          .where(eq(users.id, userId));
      }
      console.log("Upadted user table")
      // ✅ Update or create profile if player
      if (userRole === "player") {
        const profileUpdateData: Partial<typeof profile.$inferInsert> = {};
        if (data.nickname !== undefined) profileUpdateData.nickname = data.nickname;

        if (Object.keys(profileUpdateData).length > 0) {
          // Check if profile exists
          const existingProfile = await tx
            .select({ id: profile.id })
            .from(profile)
            .where(eq(profile.userId, userId))
            .limit(1);

          if (existingProfile.length > 0) {
            await tx
              .update(profile)
              .set(profileUpdateData)
              .where(eq(profile.userId, userId));
          } else {
            await tx.insert(profile).values({
              userId,
              nickname: data.nickname,
            });
          }
        }
      }
    });

    // Revalidate pages that might show profile data
    revalidatePath("/");

    return { success: true, error: null };
  } catch (error) {
    console.log(error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Hubo un error al actualizar el perfil.",
    };

  }
}
