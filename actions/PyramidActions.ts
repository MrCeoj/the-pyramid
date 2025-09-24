"use server";

import { db } from "@/lib/drizzle";
import { pyramid } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreatePyramidData {
  name: string;
  description: string;
  row_amount: number;
  active: boolean;
}

interface UpdatePyramidData {
  name: string;
  description: string;
  row_amount: number;
  active: boolean;
}

export async function createPyramid(data: CreatePyramidData) {
  try {
    await db.insert(pyramid).values({
      name: data.name,
      description: data.description || null,
      row_amount: data.row_amount,
      active: data.active,
    });

    revalidatePath("/pyramids");
    return { success: true };
  } catch (error) {
    console.error("Error creating pyramid:", error);
    throw new Error("Failed to create pyramid");
  }
}

export async function updatePyramid(id: number, data: UpdatePyramidData) {
  try {
    await db
      .update(pyramid)
      .set({
        name: data.name,
        description: data.description || null,
        row_amount: data.row_amount,
        active: data.active,
        updatedAt: new Date(),
      })
      .where(eq(pyramid.id, id));

    revalidatePath("/pyramids");
    return { success: true };
  } catch (error) {
    console.error("Error updating pyramid:", error);
    throw new Error("Failed to update pyramid");
  }
}
