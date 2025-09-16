import { db } from "@/lib/drizzle";
import { category } from "@/db/schema";

export default async function PlayerCard() {
  const data = await db.select().from(category);

  return (
    <div>
      {data.length > 0 ? (
        data.map((cat) => <div key={cat.id}>{cat.name}</div>)
      ) : (
        <div>No Cats</div>
      )}
    </div>
  );
}
