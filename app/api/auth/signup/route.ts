// app/api/auth/signup/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Define the validation schema using Zod
const userSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  name: z.string().optional(), // You can make the name optional or required
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. ✅ Validate the request body
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos de entrada inválidos",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;
    const lowercasedEmail = email.toLowerCase().trim();

    // 2. 🧐 Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, lowercasedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email." },
        { status: 409 } // 409 Conflict
      );
    }

    // 3. 🛡️ Hash the password
    const passwordHash = await bcrypt.hash(password, 10); // 10 rounds is a strong default

    // 4. 🚀 Create the new user in the database
    const newUserResult = await db
      .insert(users)
      .values({
        email: lowercasedEmail,
        passwordHash: passwordHash,
        name: name,
        // You can set a default role here if you want
        // role: "player",
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    if (newUserResult.length === 0) {
      throw new Error("No se pudo crear el usuario.");
    }
    
    // Note: The `signIn` event in your auth.ts will handle profile creation on first login.

    return NextResponse.json(newUserResult[0], { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error en la creación de usuario:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor." },
      { status: 500 }
    );
  }
}