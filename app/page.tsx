import PyramidDisplay from "@/components/pyramid/example";
import { db } from "@/lib/drizzle"
import { category } from "@/db/schema";


export default async function Home() {
  const data = await db.select().from(category)
  return (
    <div>
      {data ? (
        data.map((cat) => (
          <div key={cat.id}>
            <h3>{cat.name}</h3>
            <p>{cat.description}</p>
          </div>
        ))
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
