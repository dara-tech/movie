import React from 'react';

const MovieCardSkeleton: React.FC = () => {
  return (
    <div className="group relative transition-all duration-500 ease-out h-80 animate-pulse">
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 shadow-lg transition-all duration-300 ease-out backdrop-blur-sm h-full rounded-lg">
        {/* Main Image Skeleton */}
        <div className="relative h-full overflow-hidden rounded-t-lg">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
          
          {/* Bottom info skeleton */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            {/* Title skeleton */}
            <div className="h-4 bg-gray-700/50 rounded mb-2 w-3/4" />
            {/* Year and rating skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-700/50 rounded w-12" />
              <div className="h-3 bg-gray-700/50 rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCardSkeleton;

