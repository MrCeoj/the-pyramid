import NavAdmin from "@/components/ui/NavAdmin";
import { pyramid } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { Pyramid } from "@/types";

export default async function AdminPiramides() {
  const pyramids = (await db.select().from(pyramid)) as Pyramid[];
  
  return (
    <div>
      <NavAdmin />
      {pyramids.map((item) => (
        <div key={item.id}>
          {item.name}: {item.desc}
        </div>
      ))}
    </div>
  );
}
