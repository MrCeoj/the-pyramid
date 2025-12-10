"use server";
import { db } from "@/lib/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function validateMailExistence(email: string) {
  const loweredCasedEmail = email.toLowerCase().trim();

  if (!loweredCasedEmail || loweredCasedEmail === "") {
    return { error: "Ingresa un correo válido." };
  }

  try {
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
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

    const needAdminSetup =
      foundUser.role === "admin" && !foundUser.password;

    const userWithSetupStatus = {
      ...foundUser,
      needsProfileSetup: needsProfileSetup,
      needAdminSetup: needAdminSetup,
    };

    return { user: userWithSetupStatus };
  } catch (err) {
    console.error(err);
    return { error: "No se pudo procesar el correo.\nInténtalo de nuevo." };
  }
}