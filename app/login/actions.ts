"use server";
import * as z from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email({
    message: "Ingrese un correo electrónico válido.",
  }),
  password: z.string().min(1, {
    message: "Contraseña requerida.",
  }),
});

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
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Correo o contraseña inválidos." };
        default:
          return { error: "¡Algo salió mal!.\nInténtalo de nuevo mas tarde." };
      }
    }

    throw error;
  }
}