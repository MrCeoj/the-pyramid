"use server"
import { pyramid, pyramidCategory } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { revalidatePath } from "next/cache";

export async function createPyramid(data: CreatePyramidData) {
  try {
    await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(pyramid)
        .values({
          name: data.name,
          description: data.description || null,
          row_amount: data.row_amount,
          active: data.active,
        })
        .returning({ id: pyramid.id });

      if (data.categories.length > 0) {
        await tx.insert(pyramidCategory).values(
          data.categories.map((cat) => ({
            pyramidId: id,
            categoryId: cat,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }
    });

    revalidatePath("/piramides");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creating pyramid:", error);
    throw new Error("Failed to create pyramid");
  }
}