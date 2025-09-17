import { db } from '@/lib/drizzle';
import { pyramid } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PyramidCard } from './PyramidCard';

export async function PyramidList() {
  const pyramids = await db
    .select()
    .from(pyramid)
    .orderBy(desc(pyramid.updatedAt));

  if (pyramids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No pyramids found</div>
        <p className="text-gray-400">Create your first pyramid to get started</p>
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