import React from 'react';

const TvShowCardSkeleton: React.FC = () => {
  return (
    <div className="group relative w-full transition-all duration-300 ease-out animate-pulse">
      <div className="relative overflow-hidden bg-black border border-gray-800/50 shadow-2xl transition-all duration-300 ease-out backdrop-blur-sm rounded-2xl">
        {/* Modern Poster Image Skeleton */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          
          {/* Badge skeleton */}
          <div className="absolute top-4 left-4">
            <div className="h-6 bg-gray-700/50 rounded-full w-24" />
          </div>

          {/* Heart Icon skeleton */}
          <div className="absolute top-4 right-4">
            <div className="h-10 w-10 bg-gray-700/50 rounded-full" />
          </div>
        </div>

        {/* Modern Info Section Skeleton */}
        <div className="p-4 bg-gradient-to-b from-gray-900 to-black rounded-b-2xl">
          {/* Title skeleton */}
          <div className="h-5 bg-gray-700/50 rounded mb-2 w-3/4" />
          
          {/* Genres skeleton */}
          <div className="flex gap-1 mb-3">
            <div className="h-4 bg-gray-700/50 rounded w-16" />
            <div className="h-4 bg-gray-700/50 rounded w-20" />
          </div>

          {/* Info Badges skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gray-700/50 rounded-full w-16" />
            <div className="h-6 bg-gray-700/50 rounded-full w-20" />
            <div className="h-6 bg-gray-700/50 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TvShowCardSkeleton;

