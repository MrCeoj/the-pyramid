"use server";
import * as z from "zod";
import { AuthError } from "@auth/core/errors";
import { signIn, unstable_update, auth } from "@/lib/auth";
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
    const user = await db
      .select({
        id: users.id, // Return the user ID
        email: users.email,
        name: users.name, // Return the user name
        image: users.image, // Return the user image
        password: users.passwordHash,
        role: users.role
      })
      .from(users)
      .where(eq(users.email, loweredCasedEmail))
      .limit(1);

    if (user.length === 0) {
      return {
        error: "Tu correo no está inscrito, comunícate con los organizadores.",
      };
    }

    const profiles = await db
      .select({ userId: profile.userId })
      .from(profile)
      .where(eq(profile.userId, user[0].id));

    const hasProfile = profiles.length > 0
    const the_user = {
      ...user[0],
      hasProfile: hasProfile
    }

    // Return the full user object
    return { user: the_user };
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
  password?: string; // Add a password field
}

export async function createProfile(data: CreateProfileData) {

  try {
    const existingProfile = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, data.userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return { success: false, error: "El perfil ya existe" };
    }

    // Hash the password if provided
    let passwordHash = undefined;
    if (data.password && data.password.length > 0) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    // Use a transaction to ensure both operations succeed or fail together
    await db.transaction(async (tx) => {
      // 1. Create the profile
      await tx.insert(profile).values({
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
      });

      // 2. Update the user record with the new password hash
      await tx
        .update(users)
        .set({ passwordHash: passwordHash })
        .where(eq(users.id, data.userId));
    });

    // 3. Update the session token with the new profile status
    await unstable_update({
      user: {
        hasProfile: true,
      },
    });

    // Remove the server-side redirect
    // The client component will handle the redirection after receiving a successful response
    
    return { success: true };
  } catch (error) {
    console.error("Error creating profile or updating user:", error);
    // Add more specific error handling if needed, like unique constraint errors
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
        hasPassword: true, // optional flag
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating admin password:", error);
    return { success: false, error: "No se pudo crear la contraseña" };
  }
}
