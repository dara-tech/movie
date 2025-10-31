import React, { useState, useEffect, useCallback } from 'react';
import TVShowCard from './TvShowCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Search, Filter, Tv } from 'lucide-react';
import api from '../services/api';
import StreamingProviderFilter from './StreamingProviderFilter';

interface TVShow {
  _id: string;
  name: string;
  posterPath?: string;
  firstAirDate: string;
  lastAirDate?: string;
  voteAverage: number;
  genres: Array<{ name: string }>;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  averageRuntime?: number;
  overview?: string;
  streamingUrl?: string;
  vidsrcUrl?: string;
  tmdbId?: number;
  imdbId?: string;
  status?: string;
  type?: string;
}

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface TVShowSearchResultsProps {
  query: string;
  filters: {
    genres: string[];
    year: string;
    rating: string;
    sortBy: string;
    order: 'asc' | 'desc';
    status?: string;
    type?: string;
    provider?: number | null;
  };
  onPlay: (tvShow: TVShow) => void;
  onAddToWatchlist: (tvShow: TVShow) => void;
  onRemoveFromWatchlist: (tvShow: TVShow) => void;
  watchlist: string[];
  onFilterChange?: (newFilters: Partial<TVShowSearchResultsProps['filters']>) => void;
}

const TVShowSearchResults: React.FC<TVShowSearchResultsProps> = ({
  query,
  filters,
  onPlay,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlist,
  onFilterChange
}) => {
  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [providers, setProviders] = useState<WatchProvider[]>([]);

  const fetchResults = useCallback(async (page: number, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: filters.sortBy,
        order: filters.order,
      });

      if (query.trim()) {
        params.append('search', query.trim());
      }
      filters.genres.forEach(genreId => params.append('genre', genreId));
      if (filters.year !== 'all') {
        params.append('year', filters.year);
      }
      if (filters.rating !== 'all') {
        params.append('minRating', filters.rating);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }

      // Add provider filter
      if (filters.provider) {
        params.append('provider', filters.provider.toString());
      }

      const response = await api.get(`/api/tvshows?${params}`);
      const data = response.data;

      if (response.status === 200) {
        if (append) {
          setTvShows(prev => [...prev, ...data.tvShows]);
        } else {
          setTvShows(data.tvShows || []);
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
        setTvShows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  // Fetch watch providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await api.get('/api/tvshows/watch-providers');
        setProviders(response.data.providers || []);
      } catch (error) {
        console.error('Failed to fetch watch providers:', error);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchResults(1, false);
  }, [query, filters, fetchResults]);

  // Handle provider filter change
  const handleProviderToggle = (providerId: number | null) => {
    if (onFilterChange) {
      onFilterChange({ provider: providerId });
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchResults(nextPage, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Search results for "{query}"
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
          </div>
          {totalResults > 0 && (
            <Badge variant="secondary" className="bg-gray-800/50 text-gray-300 border-gray-700/50 text-sm px-3 py-1">
              {totalResults} results found
            </Badge>
          )}
        </div>

        {/* Streaming Provider Filter */}
        {providers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Tv className="h-4 w-4" />
              <span>Streaming Service</span>
            </div>
            <StreamingProviderFilter
              providers={providers}
              selectedProvider={filters.provider || null}
              onProviderToggle={handleProviderToggle}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-center py-8">
          <p>Error: {error}</p>
          <p>Please try again or refine your search.</p>
        </div>
      )}

      {loading && tvShows.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="w-full h-80 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {!loading && tvShows.length === 0 && !error && (
        <div className="text-gray-400 text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-xl font-semibold mb-2">No TV shows found</p>
          <p className="text-md">Try adjusting your search query or filters.</p>
        </div>
      )}

      {tvShows.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {tvShows.map((tvShow) => (
              <TVShowCard
                key={tvShow._id}
                tvShow={tvShow}
                onPlay={onPlay}
                onAddToWatchlist={onAddToWatchlist}
                onRemoveFromWatchlist={onRemoveFromWatchlist}
                isInWatchlist={watchlist.includes(tvShow._id)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Filter className="h-5 w-5 mr-2" />
                )}
                Load More ({tvShows.length} / {totalResults})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TVShowSearchResults;
