import { Suspense } from 'react';
import { PyramidList } from './PyramidList';
import { CreatePyramidButton } from './CreatePyramidButton';
import { PyramidListSkeleton } from './PyramidListSkeleton';
import UserDropdownMenu from '@/components/ui/UserDropdownMenu';

export default function PyramidsPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <h1 className="text-3xl font-bold text-white">Pirámides</h1>
        <CreatePyramidButton />
      </div>

      {/* Content area with scroll */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-20">
        <Suspense fallback={<PyramidListSkeleton />}>
          <UserDropdownMenu />
          <PyramidList />
        </Suspense>
      </div>
    </div>
  );
}
