"use server";

import { db } from "@/lib/drizzle";
import { category, pyramid, pyramidCategory } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

export async function updatePyramid(id: number, data: UpdatePyramidData) {
  try {
    await db.transaction(async (tx) => {
      // Update main pyramid row
      await tx
        .update(pyramid)
        .set({
          name: data.name,
          description: data.description || null,
          row_amount: data.row_amount,
          active: data.active,
          updatedAt: new Date(),
        })
        .where(eq(pyramid.id, id));

      // Load current categories
      const catsInPyr = (
        await tx
          .select({ cat: pyramidCategory.categoryId })
          .from(pyramidCategory)
          .where(eq(pyramidCategory.pyramidId, id))
      ).map((r) => r.cat);

      const incoming = new Set(data.categories);
      const existing = new Set(catsInPyr);

      const toAdd = [...incoming].filter((cat) => !existing.has(cat));
      const toRemove = [...existing].filter((cat) => !incoming.has(cat));

      if (toAdd.length > 0) {
        await tx.insert(pyramidCategory).values(
          toAdd.map((cat) => ({
            pyramidId: id,
            categoryId: cat,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      if (toRemove.length > 0) {
        await tx
          .delete(pyramidCategory)
          .where(
            and(eq(pyramidCategory, id), inArray(pyramidCategory, toRemove))
          );
      }
    });

    revalidatePath("/piramides");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating pyramid:", error);
    throw new Error("Failed to update pyramid");
  }
}

export async function getCategories() {
  const cats = (await db.select().from(category)).map((r) => ({
    id: r.id,
    name: r.name,
  }));
  return cats;
}
