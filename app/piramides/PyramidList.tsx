import { db } from "@/lib/drizzle";
import { pyramid, pyramidCategory } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { PyramidCard } from "./PyramidCard";

export async function PyramidList() {
  const pyramids = await db
    .select({
      id: pyramid.id,
      description: pyramid.description,
      row_amount: pyramid.row_amount,
      name: pyramid.name,
      active: pyramid.active,
      createdAt: pyramid.createdAt,
      updatedAt: pyramid.updatedAt,
      categories: sql<
        number[]
      >`COALESCE(array_agg(${pyramidCategory.categoryId}) FILTER (WHERE ${pyramidCategory.categoryId} IS NOT NULL), '{}')`,
    })
    .from(pyramid)
    .leftJoin(pyramidCategory, eq(pyramidCategory.pyramidId, pyramid.id))
    .groupBy(pyramid.id)
    .orderBy(desc(pyramid.updatedAt));


  if (pyramids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-white font-bold text-xl mb-4">
          No se encontraron pirámides
        </div>
        <p className="text-white font-semi text-lg">Crea una para empezar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pyramids.map((pyr) => (
        <PyramidCard key={pyr.id} pyramid={pyr} />
      ))}
    </div>
  );
}
