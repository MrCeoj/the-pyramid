"use server";
import * as z from "zod";
import { AuthError } from "@auth/core/errors";
import { signIn, unstable_update } from "@/lib/auth";
import { db } from "@/lib/drizzle";
import { users, profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const LoginSchema = z.object({
  email: z.string().email({
    message: "Ingrese un correo electrónico válido.",
  }),
  password: z.string().min(1, {
    message: "Contraseña requerida.",
  }),
});

export async function validateMailExistance(email: string) {
  const loweredCasedEmail = email.toLowerCase().trim();

  if (!loweredCasedEmail || loweredCasedEmail === "") {
    return { error: "Ingresa un correo válido." };
  }

  try {
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        paternalSurname: users.paternalSurname,
        maternalSurname: users.maternalSurname,
        image: users.image,
        password: users.passwordHash,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, loweredCasedEmail))
      .limit(1);

    if (userResult.length === 0) {
      return {
        error: "Tu correo no está inscrito, comunícate con los organizadores.",
      };
    }

    const foundUser = userResult[0];

    const needsProfileSetup =
      foundUser.role === "player" && !foundUser.password;

    const userWithSetupStatus = {
      ...foundUser,
      needsProfileSetup: needsProfileSetup,
    };

    return { user: userWithSetupStatus };
  } catch (err) {
    console.error(err);
    return { error: "No se pudo procesar el correo.\nInténtalo de nuevo." };
  }
}


export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CallbackRouteError") {
        const cause = error.cause?.err?.message;
        if (cause && cause === "CredentialsSignin") {
          return { error: "Correo o contraseña inválidos." };
        }
      }

      if (error.type === "CredentialsSignin") {
        return { error: "Correo o contraseña inválidos." };
      }

      return { error: "¡Algo salió mal!.\nInténtalo de nuevo mas tarde." };
    }

    throw error;
  }
}

interface CreateProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl?: string | null;
  password?: string;
}

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
          userId: data.userId,
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
    console.error("Error creating profile or updating user:", error);
    return {
      success: false,
      error: "Error al crear el perfil o actualizar el usuario.",
    };
  }
}

interface CreateAdminPasswordData {
  userId: string;
  password: string;
}

export async function createAdminPassword(data: CreateAdminPasswordData) {
  try {
    const passwordHash = await bcrypt.hash(data.password, 10);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, data.userId));

    await unstable_update({
      user: {
        hasPassword: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating admin password:", error);
    return { success: false, error: "No se pudo crear la contraseña" };
  }
}
