import { Suspense } from 'react';
import { PyramidList } from './PyramidList';
import { CreatePyramidButton } from './CreatePyramidButton';
import { PyramidListSkeleton } from './PyramidListSkeleton';

export default function PyramidsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pyramids</h1>
        <CreatePyramidButton />
      </div>
      
      <Suspense fallback={<PyramidListSkeleton />}>
        <PyramidList />
      </Suspense>
    </div>
  );
}
