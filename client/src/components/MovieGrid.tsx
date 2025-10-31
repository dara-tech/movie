import React from 'react';
import MovieCard from './MovieCard';

interface Movie {
  _id: string;
  title: string;
  posterPath?: string;
  releaseDate: string;
  voteAverage: number;
  genres: Array<{ name: string }>;
  runtime?: number;
  overview?: string;
  streamingUrl?: string;
}

interface MovieGridProps {
  movies: Movie[];
  onPlay?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  watchlist?: string[];
  loading?: boolean;
}

const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  onPlay,
  onAddToWatchlist,
  watchlist = [],
  loading = false
}) => {
  // Safety check to ensure movies is an array
  const safeMovies = Array.isArray(movies) ? movies : [];
  
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="group relative transition-all duration-500 ease-out h-80"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 shadow-lg rounded-lg h-full">
              {/* Enhanced skeleton with same design as MovieCard */}
              <div className="relative h-full overflow-hidden rounded-t-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  
                  {/* Skeleton content at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="h-4 bg-gray-600 rounded mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-600 rounded w-2/3 mb-3 animate-pulse" />
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-3 bg-gray-600 rounded w-16 animate-pulse" />
                      <div className="h-3 bg-gray-600 rounded w-12 animate-pulse" />
                    </div>
                    <div className="flex gap-1 mb-3">
                      <div className="h-5 bg-gray-600 rounded w-16 animate-pulse" />
                      <div className="h-5 bg-gray-600 rounded w-20 animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-600 rounded w-16 animate-pulse" />
                      <div className="h-6 bg-gray-600 rounded w-6 animate-pulse" />
                      <div className="h-6 bg-gray-600 rounded w-6 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (safeMovies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">No movies found</div>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {safeMovies
        .filter((m): m is Movie => Boolean(m))
        .map((movie, index) => {
          const anyMovie: any = movie as any;
          const synthesizedId = String(
            anyMovie?._id || anyMovie?.id || anyMovie?.tmdbId || `${movie.title || 'movie'}-${index}`
          );
          const normalizedMovie = { ...(movie as any), _id: synthesizedId } as Movie;

          return (
            <MovieCard
              key={synthesizedId}
              movie={normalizedMovie}
              onPlay={onPlay}
              onAddToWatchlist={onAddToWatchlist}
              isInWatchlist={watchlist.includes(synthesizedId)}
            />
          );
        })}
    </div>
  );
};

export default MovieGrid;
