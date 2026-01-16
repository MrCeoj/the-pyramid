"use server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";

// Delete user and associated data
export async function deleteUser(userId: string) {
  return await db.transaction(async (tx) => {
    // Profile will be deleted automatically due to cascade delete in schema
    // Team associations will be handled by your application logic

    const deletedUser = await tx
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    return deletedUser[0];
  });
}
