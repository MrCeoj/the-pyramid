"use server";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq, or, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface UpdateProfileData {
  // Updated user fields for Mexican naming
  paternalSurname?: string;
  maternalSurname?: string;
  email?: string;
  image?: string;
  nickname?: string;
  avatarUrl?: string;

  // Password fields (optional)
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ProfileData {
  user: {
    paternalSurname: string;
    maternalSurname: string;
    email: string | null;
    role: "player" | "admin";
    fullName: string; // Computed full name
  };
  profile: {
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
}

// Helper function to generate full name following Mexican convention
function getFullName(paternalSurname: string, maternalSurname: string): string {
  return `${paternalSurname} ${maternalSurname}`;
}

// Helper function to get display name (nickname or full name)
function getDisplayName(
  paternalSurname: string,
  maternalSurname: string,
  nickname?: string | null
): string {
  return nickname || getFullName(paternalSurname, maternalSurname);
}

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
        fullName: getFullName(user.paternalSurname, user.maternalSurname),
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
          user.passwordHash
        );

        if (!isMatch) {
          throw new Error("La contraseña actual es incorrecta.");
        }

        console.debug("Password match");

        const sameAsBefore = await bcrypt.compare(
          data.newPassword,
          user.passwordHash
        );

        if (sameAsBefore) {
          throw new Error(
            "La nueva contraseña no puede ser igual a la actual."
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

// New utility functions for the updated schema

export async function getUserDisplayName(
  userId: string
): Promise<string | null> {
  try {
    const userData = await db
      .select({
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        nickname: profile.nickname,
      })
      .from(users)
      .where(eq(users.id, userId))
      .leftJoin(profile, eq(profile.userId, users.id))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    const user = userData[0];
    return getDisplayName(
      user.paternalSurname,
      user.maternalSurname,
      user.nickname
    );
  } catch (error) {
    console.error("Error getting user display name:", error);
    return null;
  }
}

export async function getUserFullName(userId: string): Promise<string | null> {
  try {
    const userData = await db
      .select({
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    const user = userData[0];
    return getFullName(user.paternalSurname, user.maternalSurname);
  } catch (error) {
    console.error("Error getting user full name:", error);
    return null;
  }
}

export async function searchUsersBySurname(
  searchTerm: string,
  limit: number = 10
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
          like(profile.nickname, `%${searchTerm}%`)
        )
      )
      .limit(limit);

    return user.map((user) => ({
      id: user.id,
      fullName: getFullName(user.paternalSurname, user.maternalSurname),
      displayName: getDisplayName(
        user.paternalSurname,
        user.maternalSurname,
        user.nickname
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

// Validation helpers
export async function validateMexicanName(
  paternalSurname: string,
  maternalSurname: string
) {
  if (!paternalSurname || paternalSurname.trim().length < 2) {
    return "El apellido paterno debe tener al menos 2 caracteres.";
  }

  if (!maternalSurname || maternalSurname.trim().length < 2) {
    return "El apellido materno debe tener al menos 2 caracteres.";
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-']+$/;

  if (!nameRegex.test(paternalSurname)) {
    return "El apellido paterno contiene caracteres inválidos.";
  }

  if (!nameRegex.test(maternalSurname)) {
    return "El apellido materno contiene caracteres inválidos.";
  }

  return null;
}

export async function validateNickname(nickname: string) {
  if (nickname && nickname.length > 0) {
    if (nickname.length < 2) {
      return "El apodo debe tener al menos 2 caracteres.";
    }

    if (nickname.length > 20) {
      return "El apodo no puede tener más de 20 caracteres.";
    }

    // Allow letters, numbers, spaces, but not special characters for nicknames
    const nicknameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s]+$/;

    if (!nicknameRegex.test(nickname)) {
      return "El apodo contiene caracteres inválidos.";
    }
  }

  return null;
}
