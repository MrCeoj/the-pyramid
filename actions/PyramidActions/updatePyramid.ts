"use server";
import { db } from "@/lib/drizzle";
import { pyramid, pyramidCategory } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCategoriesInPyramid } from "../TeamsActions";

type updatePyramidProps = { success: true } | { success: false; error: string };

export async function updatePyramid(id: number, data: UpdatePyramidData): Promise<updatePyramidProps> {
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

      console.log("incoming", incoming, "existing", existing);

      const toAdd = [...incoming].filter((cat) => !existing.has(cat));
      const toRemove = new Set(
        [...existing].filter((cat) => !incoming.has(cat)),
      );

      console.log("toadd", toAdd, "toremove", toRemove);

      if (toAdd.length > 0) {
        await tx.insert(pyramidCategory).values(
          toAdd.map((cat) => ({
            pyramidId: id,
            categoryId: cat,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        );
      }

      if (toRemove.size > 0) {
        const catsInPyr = await getCategoriesInPyramid(id, tx);
        if (!catsInPyr.success)
          throw new Error("Error al comprobar las categorías existentes");

        const usedCategories = new Set(catsInPyr.cats);

        const hasConflict = [...toRemove].some((cat) =>
          usedCategories.has(cat),
        );

        if (hasConflict) {
          throw new Error(
            "Existen equipos con alguna categoría que querías eliminar.",
          );
        }
        await tx
          .delete(pyramidCategory)
          .where(
            and(
              eq(pyramidCategory.pyramidId, id),
              inArray(pyramidCategory.categoryId, Array.from(toRemove)),
            ),
          );
      }
    });

    revalidatePath("/piramides");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Hubo un error inesperado, inténtalo de nuevo más tarde.",
    };
  }
}
