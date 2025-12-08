"use server";

import { db } from "@/lib/drizzle";
import { category, pyramid, pyramidCategory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreatePyramidData {
  name: string;
  description: string;
  row_amount: number;
  active: boolean;
  categories: number[];
}

interface UpdatePyramidData {
  name: string;
  description: string;
  row_amount: number;
  active: boolean;
  categories: number[];
}

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

      for (const cat of data.categories) {
        await tx.insert(pyramidCategory).values({
          pyramidId: id,
          categoryId: cat,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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

      for (const cat of toAdd) {
        await tx.insert(pyramidCategory).values({
          pyramidId: id,
          categoryId: cat,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Delete removed ones
      for (const cat of toRemove) {
        await tx
          .delete(pyramidCategory)
          .where(
            and(
              eq(pyramidCategory.pyramidId, id),
              eq(pyramidCategory.categoryId, cat)
            )
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
