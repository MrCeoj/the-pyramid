"use server";
import z from "zod";
import { AuthError } from "@auth/core/errors";
import { signIn } from "@/lib/auth";
import { LoginSchema } from "@/types/custom";

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
