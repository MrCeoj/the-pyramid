"use server";
import { unstable_update } from "@/lib/auth";
import { db } from "@/lib/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function createAdminPassword(data: CreateAdminPasswordData) {
  try {
    await db.transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(data.password, 10);

      const res = await tx
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, data.userId));

      if (res.length === 0){
        throw new Error("Usuario no encontrado")
      }
    });

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
