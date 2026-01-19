"use server";

import { pyramid } from "@/db/schema";
import { db } from "@/lib/drizzle";

export default async function getAllPyramids() {
  try {
    const pyrs = (await db
      .select({ id: pyramid.id, name: pyramid.name })
      .from(pyramid)) satisfies Pick<Pyramid, "id" | "name">[];

    return pyrs;
  } catch (error) {}
}
