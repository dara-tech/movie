import React, { useState, useEffect, useCallback } from 'react';
import MovieCard from './MovieCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Search, Filter, SortAsc, SortDesc, Image } from 'lucide-react';
import api from '../services/api';

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
  vidsrcUrl?: string;
}

interface SearchResultsProps {
  query: string;
  filters: {
    genres: string[];
    year: string;
    rating: string;
    sortBy: string;
    order: 'asc' | 'desc';
  };
  onPlay: (movie: Movie) => void;
  onAddToWatchlist: (movie: Movie) => void;
  watchlist: string[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  filters,
  onPlay,
  onAddToWatchlist,
  watchlist
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);

  // Debounced search function
  const searchMovies = useCallback(async (searchQuery: string, searchFilters: typeof filters, page: number = 1, append: boolean = false) => {
    if (!searchQuery.trim()) {
      setMovies([]);
      setTotalResults(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: searchQuery,
        page: page.toString(),
        limit: '20',
        sortBy: searchFilters.sortBy,
        order: searchFilters.order
      });

      // Add genre filters
      if (searchFilters.genres.length > 0) {
        searchFilters.genres.forEach(genreId => {
          params.append('genre', genreId);
        });
      }

      // Add year filter
      if (searchFilters.year !== 'all') {
        params.append('year', searchFilters.year);
      }

      // Add rating filter
      if (searchFilters.rating !== 'all') {
        params.append('minRating', searchFilters.rating);
      }

      const response = await api.get(`/api/movies?${params}`);
      const data = response.data;

      if (response.status === 200) {
        if (append) {
          setMovies(prev => [...prev, ...data.movies]);
        } else {
          setMovies(data.movies || []);
        }
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.total || 0);
        setHasMore(page < (data.totalPages || 1));
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (!append) {
        setMovies([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Search when query or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      searchMovies(query, filters, 1, false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters, searchMovies]);

  // Load more results
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      searchMovies(query, filters, nextPage, true);
    }
  };

  // Get filter summary
  const getFilterSummary = () => {
    const parts = [];
    if (filters.genres.length > 0) parts.push(`${filters.genres.length} genre${filters.genres.length > 1 ? 's' : ''}`);
    if (filters.year !== 'all') parts.push(filters.year);
    if (filters.rating !== 'all') parts.push(`${filters.rating}+ stars`);
    return parts.length > 0 ? ` • ${parts.join(' • ')}` : '';
  };

  if (!query.trim()) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold text-white">
            Search results for "{query}"
          </h2>
          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
            {getFilterSummary()}
          </Badge>
          <Button
            onClick={() => setShowImageSearch(!showImageSearch)}
            variant="outline"
            size="sm"
            className="ml-auto border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Image className="h-4 w-4 mr-2" />
            {showImageSearch ? 'Hide Images' : 'Show Images'}
          </Button>
        </div>
        
        {filters.sortBy !== 'popularity' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Filter className="h-4 w-4" />
            <span>Sorted by {filters.sortBy}</span>
            {filters.order === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </div>
        )}
      </div>

      {/* Image Search Panel */}
      {showImageSearch && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Image className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-white">Visual Search</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {movies.slice(0, 12).map((movie) => (
              <div
                key={`image-${movie._id}`}
                className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
                onClick={() => onPlay(movie)}
              >
                {movie.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs font-medium truncate">{movie.title}</p>
                </div>
              </div>
            ))}
          </div>
          {movies.length > 12 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Showing first 12 images • {movies.length - 12} more available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && movies.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-red-500" />
            <span className="text-gray-400">Searching movies...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {movies.length > 0 && (
        <div className="space-y-6">
          {/* Movie Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onPlay={onPlay}
                onAddToWatchlist={onAddToWatchlist}
                isInWatchlist={watchlist.includes(movie._id)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={loadMore}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Results'
                )}
              </Button>
            </div>
          )}

          {/* Results Summary */}
          <div className="text-center text-sm text-gray-400">
            Showing {movies.length} of {totalResults} results
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && movies.length === 0 && !error && query.trim() && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No movies found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search terms or filters
          </p>
          <div className="text-sm text-gray-600">
            <p>• Check your spelling</p>
            <p>• Try different keywords</p>
            <p>• Remove some filters</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
