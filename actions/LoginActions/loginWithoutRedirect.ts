"use server";
import * as z from "zod";
import { AuthError } from "@auth/core/errors";
import { signIn } from "@/lib/auth";
import { LoginSchema } from "./types";

// New function for login without redirect
export async function loginWithoutRedirect(
  values: z.infer<typeof LoginSchema>
) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }

  const { email, password } = validatedFields.data;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // This prevents the redirect
    });

    if (result?.error) {
      return { error: "Correo o contraseña inválidos." };
    }

    return { success: true };
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

    console.error("Login error:", error);
    return { error: "Error de autenticación." };
  }
}