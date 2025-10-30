import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, X, Film, Tv, Image } from 'lucide-react';
import MovieCard from './MovieCard';
import TvShowCard from './TvShowCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Input } from './ui/input';

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showImages, setShowImages] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMovies([]);
      setTvShows([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      setMovies(response.data.movies || []);
      setTvShows(response.data.tvShows || []);
      setTotalResults(response.data.total || 0);
    } catch (error) {
      console.error('Error searching:', error);
      showToast('Failed to search. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  }, [searchParams, performSearch, query]);

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
        </div>

        {/* Results */}
        {query && (
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
                      Found <span className="text-white font-semibold">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for <span className="text-white font-semibold">"{query}"</span>
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
        {!query && (
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
