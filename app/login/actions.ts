// lib/actions.ts
"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth"; // Your auth.ts file

// Define the schema for login form validation using Zod
const LoginSchema = z.object({
  email: z.string().email({
    message: "Ingrese un correo electrónico válido.",
  }),
  password: z.string().min(1, {
    message: "Contraseña requerida.",
  }),
});

// The server action for logging in a user
export async function login(values: z.infer<typeof LoginSchema>) {
  // 1. Validate the input fields on the server
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos." };
  }

  const { email, password } = validatedFields.data;

  // 2. Attempt to sign in the user with the 'credentials' provider
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // Redirect to a protected page on success
    });
    // If signIn is successful, a redirect will happen automatically,
    // and this part of the code will not be reached.
  } catch (error) {
    // 3. Handle specific authentication errors
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          // This error type is thrown by your authorize function
          return { error: "Correo o contraseña inválidos." };
        default:
          // Handle other auth-related errors (e.g., configuration issues)
          return { error: "¡Algo salió mal!.\nInténtalo de nuevo mas tarde." };
      }
    }

    // 4. For any other unexpected errors, re-throw them
    // This will be caught by the nearest error boundary in Next.js
    throw error;
  }
}