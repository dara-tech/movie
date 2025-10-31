import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, X, Film, Tv, Image, Loader2 } from 'lucide-react';
import MovieCard from './MovieCard';
import TvShowCard from './TvShowCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import StreamingProviderFilter from './StreamingProviderFilter';

interface Movie {
  _id: string;
  title: string;
  posterPath?: string;
  releaseDate: string;
  voteAverage: number;
  genres: Array<{ _id?: string; name: string }>;
  runtime?: number;
  overview?: string;
  streamingUrl?: string;
  vidsrcUrl?: string;
}

interface TvShow {
  _id: string;
  name: string;
  posterPath?: string;
  firstAirDate: string;
  voteAverage: number;
  genres: Array<{ _id?: string; name: string }>;
  overview?: string;
  streamingUrl?: string;
  vidsrcUrl?: string;
}

interface Suggestion {
  type: 'movie' | 'tvshow' | 'genre';
  text: string;
  value: string;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<TvShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [movieCurrentPage, setMovieCurrentPage] = useState(1);
  const [tvShowCurrentPage, setTvShowCurrentPage] = useState(1);
  const [movieTotalPages, setMovieTotalPages] = useState(1);
  const [tvShowTotalPages, setTvShowTotalPages] = useState(1);
  const [showImages, setShowImages] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [providers, setProviders] = useState<Array<{provider_id: number; provider_name: string; logo_path: string}>>([]);

  const performSearch = useCallback(async (searchQuery: string, page: number = 1, append: boolean = false) => {
    // If no query and no provider, clear results
    if (!searchQuery.trim() && !selectedProvider) {
      setMovies([]);
      setTvShows([]);
      setTotalResults(0);
      return;
    }

    const isLoading = append ? setLoadingMore : setLoading;
    isLoading(true);
    try {
      if (searchQuery.trim()) {
        // If there's a search query, use search endpoint
        const params = new URLSearchParams({ 
          q: searchQuery.trim(),
          page: page.toString(),
          limit: '20'
        });
        if (selectedProvider) {
          params.append('provider', selectedProvider.toString());
        }
        const response = await api.get(`/api/search?${params}`);
        const responseData = response.data;
        
        if (append) {
          setMovies(prev => [...prev, ...(responseData.movies || [])]);
          setTvShows(prev => [...prev, ...(responseData.tvShows || [])]);
        } else {
          setMovies(responseData.movies || []);
          setTvShows(responseData.tvShows || []);
          setMovieCurrentPage(1);
          setTvShowCurrentPage(1);
        }
        
        const totalItems = responseData.total || 0;
        const combinedTotalPages = responseData.totalPages || 1;
        
        // For search results, we need a combined load more since the API returns them together
        setTotalResults(totalItems);
        setMovieTotalPages(combinedTotalPages);
        setTvShowTotalPages(combinedTotalPages);
      } else if (selectedProvider) {
        // If no query but provider is selected, browse by provider
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          api.get(`/api/movies?provider=${selectedProvider}&limit=20&page=${page}`).catch(() => ({ data: { movies: [], total: 0, totalPages: 1 } })),
          api.get(`/api/tvshows?provider=${selectedProvider}&limit=20&page=${page}`).catch(() => ({ data: { tvShows: [], total: 0, totalPages: 1 } }))
        ]);
        
        const movies = moviesResponse.data.movies || [];
        const tvShows = tvShowsResponse.data.tvShows || [];
        const moviesTotal = moviesResponse.data.total || 0;
        const tvShowsTotal = tvShowsResponse.data.total || 0;
        const moviePages = moviesResponse.data.totalPages || 1;
        const tvShowPages = tvShowsResponse.data.totalPages || 1;
        
        if (append) {
          setMovies(prev => [...prev, ...movies]);
          setTvShows(prev => [...prev, ...tvShows]);
        } else {
          setMovies(movies);
          setTvShows(tvShows);
          setMovieCurrentPage(1);
          setTvShowCurrentPage(1);
        }
        setTotalResults(moviesTotal + tvShowsTotal);
        setMovieTotalPages(moviePages);
        setTvShowTotalPages(tvShowPages);
      }
    } catch (error) {
      console.error('Error searching:', error);
      showToast('Failed to search. Please try again.', 'error');
    } finally {
      isLoading(false);
    }
  }, [showToast, selectedProvider]);

  // Fetch watch providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          api.get('/api/movies/watch-providers').catch(() => ({ data: { providers: [] } })),
          api.get('/api/tvshows/watch-providers').catch(() => ({ data: { providers: [] } }))
        ]);
        
        // Combine providers from both sources, deduplicate by provider_id
        const moviesProviders = moviesResponse.data.providers || [];
        const tvShowsProviders = tvShowsResponse.data.providers || [];
        const combined = [...moviesProviders];
        
        tvShowsProviders.forEach((tvProvider: typeof tvShowsProviders[0]) => {
          if (!combined.find(p => p.provider_id === tvProvider.provider_id)) {
            combined.push(tvProvider);
          }
        });
        
        setProviders(combined);
      } catch (error) {
        console.error('Failed to fetch watch providers:', error);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    // Trigger search when query changes OR provider changes
    setMovieCurrentPage(1);
    setTvShowCurrentPage(1);
    performSearch(query.trim(), 1, false);
  }, [searchParams, performSearch, query, selectedProvider]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);
    
    if (value.length >= 2) {
      try {
        const response = await api.get(`/api/search/suggestions?q=${encodeURIComponent(value)}`);
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.value);
    setSearchParams({ q: suggestion.value });
    performSearch(suggestion.value);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setQuery('');
    setMovies([]);
    setTvShows([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedProvider(null);
    setSearchParams({});
  };

  const handlePlayMovie = (movie: Movie) => {
    navigate(`/movie/${movie._id}`);
  };

  const handlePlayTvShow = (tvShow: TvShow) => {
    navigate(`/tvshow/${tvShow._id}`);
  };

  const handleAddToWatchlist = async (item: Movie | TvShow, type: 'movie' | 'tvshow') => {
    if (!user) {
      showToast('Please log in to add to watchlist', 'error');
      return;
    }

    try {
      const endpoint = type === 'movie' 
        ? `/api/movies/${item._id}/watchlist`
        : `/api/tvshows/${item._id}/watchlist`;
      
      await api.post(endpoint);
      const title = type === 'movie' ? (item as Movie).title : (item as TvShow).name;
      showToast(`"${title}" added to watchlist!`, 'success');
    } catch (error: any) {
      if (error.response?.status === 401) {
        showToast('Please log in to add to watchlist', 'error');
      } else if (error.response?.status === 400) {
        showToast('Already in your watchlist!', 'error');
      } else {
        showToast('Failed to add to watchlist. Please try again.', 'error');
      }
    }
  };

  const handleLoadMore = () => {
    // For search, we increment a combined counter since the API returns both together
    const nextPage = movieCurrentPage < tvShowCurrentPage ? tvShowCurrentPage + 1 : movieCurrentPage + 1;
    if (!loadingMore && nextPage <= movieTotalPages) {
      setMovieCurrentPage(nextPage);
      setTvShowCurrentPage(nextPage);
      performSearch(query.trim(), nextPage, true);
    }
  };

  const handleLoadMoreMovies = () => {
    if (!loadingMore && movieCurrentPage < movieTotalPages) {
      const nextPage = movieCurrentPage + 1;
      setMovieCurrentPage(nextPage);
      performSearch(query.trim(), nextPage, true);
    }
  };

  const handleLoadMoreTvShows = () => {
    if (!loadingMore && tvShowCurrentPage < tvShowTotalPages) {
      const nextPage = tvShowCurrentPage + 1;
      setTvShowCurrentPage(nextPage);
      performSearch(query.trim(), nextPage, true);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
        {/* Search Input */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200" />
              <Input
                type="text"
                placeholder="Search for movies, TV shows, and more..."
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                className="w-full pl-14 pr-14 h-14 bg-black/50 border border-gray-600 text-white placeholder-gray-400  focus:bg-black/70 transition-all duration-200 text-lg rounded-none"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Clear search"
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-700/50 rounded-full transition-all duration-200"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 rounded-lg border border-gray-700 shadow-xl max-h-96 overflow-y-auto z-50">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion.type === 'movie' && <Film className="h-5 w-5 text-blue-400" />}
                    {suggestion.type === 'tvshow' && <Tv className="h-5 w-5 text-purple-400" />}
                    {suggestion.type === 'genre' && <div className="h-5 w-5 rounded-full bg-red-500" />}
                    <span className="text-white text-sm">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Advanced Filters Section - Under Search Bar */}
          <div className="mt-6 space-y-4">
            {/* Streaming Provider Filter */}
            {providers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Tv className="h-4 w-4" />
                  <span className="uppercase tracking-wider">Streaming Service</span>
                  {selectedProvider && (
                    <button
                      onClick={() => setSelectedProvider(null)}
                      className="ml-auto text-xs text-red-500 hover:text-red-400 uppercase tracking-wider"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className="bg-gray-900/50 border border-gray-800/50 p-4">
                  <StreamingProviderFilter
                    providers={providers}
                    selectedProvider={selectedProvider}
                    onProviderToggle={(providerId) => setSelectedProvider(providerId)}
                    className=""
                  />
                </div>
                {selectedProvider && (
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>Filtering by:</span>
                    <span className="text-white font-semibold">
                      {providers.find(p => p.provider_id === selectedProvider)?.provider_name || 'Selected service'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {(query || selectedProvider) && (
          <div className="space-y-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 20 }).map((_, index) => (
                  <MovieCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <>
                {/* Summary */}
                {totalResults > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-400">
                      {query ? (
                        <>Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for <span className="text-white font-semibold">"{query}"</span></>
                      ) : selectedProvider ? (
                        <>Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} on <span className="text-white font-semibold">{providers.find(p => p.provider_id === selectedProvider)?.provider_name || 'selected service'}</span></>
                      ) : (
                        <>Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''}</>
                      )}
                    </div>
                    <button
                      onClick={() => setShowImages(!showImages)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors duration-200"
                      title={showImages ? 'Hide Images' : 'Show Images'}
                    >
                      <Image className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Movies Results */}
                {movies.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Film className="h-6 w-6 text-blue-400" />
                      Movies
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {movies.map((movie) => (
                        <MovieCard
                          key={movie._id}
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={() => handleAddToWatchlist(movie, 'movie')}
                        />
                      ))}
                    </div>
                    
                    {/* Load More Movies Button */}
                    {movieCurrentPage < movieTotalPages && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={handleLoadMoreMovies}
                          disabled={loadingMore}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-8 rounded-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            `Load More Movies (${movies.length} / ${totalResults})`
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* TV Shows Results */}
                {tvShows.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Tv className="h-6 w-6 text-purple-400" />
                      TV Shows
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {tvShows.map((tvShow) => (
                        <TvShowCard
                          key={tvShow._id}
                          tvShow={tvShow}
                          onPlay={handlePlayTvShow}
                          onAddToWatchlist={() => handleAddToWatchlist(tvShow, 'tvshow')}
                        />
                      ))}
                    </div>
                    
                    {/* Load More TV Shows Button */}
                    {tvShowCurrentPage < tvShowTotalPages && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={handleLoadMoreTvShows}
                          disabled={loadingMore}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-8 rounded-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            `Load More TV Shows (${tvShows.length} / ${totalResults})`
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* No Results */}
                {movies.length === 0 && tvShows.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                    <p className="text-gray-400">Try searching for something else</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!query && !selectedProvider && (
          <div className="text-center py-16">
            <Search className="h-24 w-24 text-gray-700 mx-auto mb-6 opacity-50" />
            <h2 className="text-3xl font-bold text-white mb-4">Search for anything</h2>
            <p className="text-gray-400 text-lg mb-8">
              Find your favorite movies and TV shows
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                <span>Movies</span>
              </div>
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4" />
                <span>TV Shows</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
