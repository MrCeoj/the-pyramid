"use server";
import { db } from "@/lib/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function validateMailExistence(email: string) {
  const loweredCasedEmail = email.toLowerCase().trim();

  if (!loweredCasedEmail) {
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

    // --------------------------------------------
    // CASE: Email does not exist → Allow registration
    // --------------------------------------------
    if (userResult.length === 0) {
      return {
        user: {
          email: loweredCasedEmail,
          needsRegistration: true,
          needsProfileSetup: false,
          needAdminSetup: false,
        },
      };
    }

    // --------------------------------------------
    // CASE: User exists → Keep original logic
    // --------------------------------------------
    const foundUser = userResult[0];

    const needsProfileSetup =
      foundUser.role === "player" && !foundUser.password;

    const needAdminSetup = foundUser.role === "admin" && !foundUser.password;

    return {
      user: {
        ...foundUser,
        needsProfileSetup,
        needAdminSetup,
        needsRegistration: false,
      },
    };
  } catch (err) {
    console.error(err);
    return { error: "No se pudo procesar el correo.\nInténtalo de nuevo." };
  }
}
