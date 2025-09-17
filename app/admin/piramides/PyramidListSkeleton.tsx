'use client';

export function PyramidListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="flex justify-end space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
