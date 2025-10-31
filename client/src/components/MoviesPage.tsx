import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './MovieCardSkeleton';
import LoadingSpinner from './LoadingSpinner';
import SearchResults from './SearchResults';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface SearchFilters {
  query: string;
  genres: string[];
  year: string;
  rating: string;
  sortBy: string;
  order: 'asc' | 'desc';
  provider?: number | null;
}

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
  tmdbId?: number;
  imdbId?: string;
}

interface Genre {
  _id: string;
  name: string;
  tmdbId?: number;
}

const MoviesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: searchParams.get('search') || '',
    genres: [],
    year: 'all',
    rating: 'all',
    sortBy: 'popularity',
    order: 'desc',
    provider: null
  });
  const [isSearching] = useState(false);
  const [movies] = useState<Movie[]>([]);
  
  // Category data
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<Movie[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [lastScrollTime, setLastScrollTime] = useState<{[key: string]: number}>({});

  // Pagination state for each category
  const [categoryPages, setCategoryPages] = useState<{[key: string]: number}>({
    trending: 1,
    popular: 1,
    topRated: 1,
    upcoming: 1,
    action: 1,
    comedy: 1,
    drama: 1,
    horror: 1,
    romance: 1,
    sciFi: 1,
    thriller: 1
  });

  const [categoryTotals, setCategoryTotals] = useState<{[key: string]: number}>({
    trending: 0,
    popular: 0,
    topRated: 0,
    upcoming: 0,
    action: 0,
    comedy: 0,
    drama: 0,
    horror: 0,
    romance: 0,
    sciFi: 0,
    thriller: 0
  });

  const [genrePages, setGenrePages] = useState<{[key: string]: number}>({
    action: 1,
    comedy: 1,
    drama: 1,
    horror: 1,
    romance: 1,
    sciFi: 1,
    thriller: 1
  });
  
  // Track which genre sections have been loaded to prevent duplicate fetches
  const [loadedGenres, setLoadedGenres] = useState<Set<string>>(new Set());
  const [genreLoadingFlags, setGenreLoadingFlags] = useState<{[key: string]: boolean}>({});

  const fetchGenres = async () => {
    try {
      const response = await api.get('/api/genres');
      setGenres(response.data);
      console.log('Available genres:', response.data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchCategoryMovies = async (category: string, page: number = 1, append: boolean = false) => {
    try {
      if (!append) setCategoryLoading(true);
      
      const limit = 20;
      let response: any;
      
      switch (category) {
        case 'trending':
          response = await api.get(`/api/movies/trending?limit=${limit}&page=${page}`);
          if (append) {
            setTrendingMovies(prev => [...prev, ...response.data.movies]);
          } else {
            setTrendingMovies(response.data.movies);
          }
          setCategoryTotals(prev => ({ ...prev, trending: response.data.total }));
          break;
        case 'popular':
          response = await api.get(`/api/movies/popular?limit=${limit}&page=${page}`);
          if (append) {
            setPopularMovies(prev => [...prev, ...response.data.movies]);
          } else {
            setPopularMovies(response.data.movies);
          }
          setCategoryTotals(prev => ({ ...prev, popular: response.data.total }));
          break;
        case 'topRated':
          response = await api.get(`/api/movies/top-rated?limit=${limit}&page=${page}`);
          if (append) {
            setTopRatedMovies(prev => [...prev, ...response.data.movies]);
          } else {
            setTopRatedMovies(response.data.movies);
          }
          setCategoryTotals(prev => ({ ...prev, topRated: response.data.total }));
          break;
        case 'upcoming':
          response = await api.get(`/api/movies/upcoming?limit=${limit}&page=${page}`);
          if (append) {
            setUpcomingMovies(prev => [...prev, ...response.data.movies]);
          } else {
            setUpcomingMovies(response.data.movies);
          }
          setCategoryTotals(prev => ({ ...prev, upcoming: response.data.total }));
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${category} movies:`, error);
    } finally {
      if (!append) setCategoryLoading(false);
    }
  };

  // Fetch movies by genre with pagination support
  const fetchMoviesByGenre = useCallback(async (genreName: string, page: number = 1, append: boolean = false) => {
    // Prevent duplicate fetches for the same genre/page
    const cacheKey = `${genreName}-${page}`;
    if (!append && loadedGenres.has(cacheKey)) {
      console.log(`Skipping duplicate fetch for ${cacheKey}`);
      return;
    }
    
    // Set loading flag
    setGenreLoadingFlags(prev => ({ ...prev, [genreName]: true }));
    
    try {
      console.log(`Fetching ${genreName} movies, page ${page}, append: ${append}`);
      
      // Wait for genres to be loaded first
      if (genres.length === 0) {
        console.log('Genres not loaded yet, retrying in 1 second...');
        setTimeout(() => fetchMoviesByGenre(genreName, page, append), 1000);
        return;
      }

      console.log('Available genres:', genres.map(g => g.name));

      // Find the genre ID by name (prioritize genres with tmdbId)
      const matchingGenres = genres.filter(g => 
        g.name.toLowerCase() === genreName.toLowerCase() ||
        g.name.toLowerCase().includes(genreName.toLowerCase()) ||
        genreName.toLowerCase().includes(g.name.toLowerCase())
      );
      
      // Prioritize genres with tmdbId (they have actual movie data)
      const genre = matchingGenres.find(g => g.tmdbId) || matchingGenres[0];
      
      if (genre) {
        console.log(`Found genre: ${genre.name} (ID: ${genre._id})`);
        const response = await api.get(`/api/movies?genre=${genre._id}&limit=20&page=${page}`);
        console.log(`API response for ${genreName}:`, response.data);
        
        // Map genre names to setters
        const genreMap: {[key: string]: any} = {
          'Action': { setter: setActionMovies, key: 'action' },
          'Comedy': { setter: setComedyMovies, key: 'comedy' },
          'Drama': { setter: setDramaMovies, key: 'drama' },
          'Horror': { setter: setHorrorMovies, key: 'horror' },
          'Romance': { setter: setRomanceMovies, key: 'romance' },
          'Science Fiction': { setter: setSciFiMovies, key: 'sciFi' },
          'Thriller': { setter: setThrillerMovies, key: 'thriller' }
        };

        const genreInfo = genreMap[genreName];
        if (genreInfo) {
          if (append) {
            genreInfo.setter((prev: Movie[]) => [...prev, ...(response.data.movies || [])]);
          } else {
            genreInfo.setter(response.data.movies || []);
          }
          setCategoryTotals(prev => ({ ...prev, [genreInfo.key]: response.data.total || 0 }));
          console.log(`Successfully updated ${genreInfo.key} with ${(response.data.movies || []).length} movies`);
          
          // Mark as loaded
          if (!append) {
            setLoadedGenres(prev => new Set(prev).add(cacheKey));
          }
        } else {
          console.log(`No genre info found for: ${genreName}`);
        }
      } else {
        console.log(`Genre "${genreName}" not found. Available genres:`, genres.map(g => g.name));
        // Fallback: try to fetch from main categories if genre not found
        console.log(`Trying fallback for ${genreName}...`);
        const fallbackResponse = await api.get(`/api/movies/popular?limit=20&page=${page}`);
        
        const genreMap: {[key: string]: any} = {
          'Action': { setter: setActionMovies, key: 'action' },
          'Comedy': { setter: setComedyMovies, key: 'comedy' },
          'Drama': { setter: setDramaMovies, key: 'drama' },
          'Horror': { setter: setHorrorMovies, key: 'horror' },
          'Romance': { setter: setRomanceMovies, key: 'romance' },
          'Science Fiction': { setter: setSciFiMovies, key: 'sciFi' },
          'Thriller': { setter: setThrillerMovies, key: 'thriller' }
        };

        const genreInfo = genreMap[genreName];
        if (genreInfo) {
          genreInfo.setter(fallbackResponse.data.movies || []);
          setCategoryTotals(prev => ({ ...prev, [genreInfo.key]: fallbackResponse.data.total || 0 }));
          console.log(`Fallback successful for ${genreInfo.key}`);
          
          // Mark as loaded
          if (!append) {
            setLoadedGenres(prev => new Set(prev).add(cacheKey));
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${genreName} movies:`, error);
    } finally {
      setCategoryLoading(false);
      setGenreLoadingFlags(prev => ({ ...prev, [genreName]: false }));
    }
  }, [genres, loadedGenres]);

  // Load more movies for a specific genre with smart loading
  const loadMoreGenreMovies = async (genreName: string) => {
    // Map genre names to the correct keys used in genrePages state
    const genreKeyMap: {[key: string]: string} = {
      'Action': 'action',
      'Comedy': 'comedy', 
      'Drama': 'drama',
      'Horror': 'horror',
      'Romance': 'romance',
      'Science Fiction': 'sciFi',
      'Thriller': 'thriller'
    };
    
    const genreKey = genreKeyMap[genreName];
    if (genreKey) {
      // Check if already loading this genre
      if (loadingStates[genreKey]) {
        console.log(`Already loading ${genreName}, skipping...`);
        return;
      }

      const newPage = genrePages[genreKey] + 1;
      const totalPages = Math.ceil((categoryTotals[genreKey] || 0) / 20);
      
      // Check if we've reached the maximum pages
      if (newPage > totalPages) {
        console.log(`Reached max pages for ${genreName}: ${newPage} > ${totalPages}`);
        return;
      }

      // Set loading state for this genre
      setLoadingStates(prev => ({ ...prev, [genreKey]: true }));
      setGenrePages(prev => ({ ...prev, [genreKey]: newPage }));
      
      try {
        await fetchMoviesByGenre(genreName, newPage, true);
      } catch (error) {
        console.error(`Error loading more ${genreName} movies:`, error);
      } finally {
        // Clear loading state for this genre
        setLoadingStates(prev => ({ ...prev, [genreKey]: false }));
      }
    }
  };


  useEffect(() => {
    fetchGenres();
    // Fetch initial pages for all categories
    fetchCategoryMovies('trending', 1);
    fetchCategoryMovies('popular', 1);
    fetchCategoryMovies('topRated', 1);
    fetchCategoryMovies('upcoming', 1);
  }, []);

  // Fetch genre movies after genres are loaded - batch load in groups to prevent overload
  useEffect(() => {
    console.log('Genres loaded:', genres.length, genres.map(g => g.name));
    if (genres.length > 0) {
      console.log('Fetching genre movies in batches...');
      // Batch 1: Load first 2 genres immediately
      fetchMoviesByGenre('Action', 1);
      fetchMoviesByGenre('Comedy', 1);
      
      // Batch 2: Load next 2 genres after 500ms
      setTimeout(() => {
        fetchMoviesByGenre('Drama', 1);
        fetchMoviesByGenre('Horror', 1);
      }, 500);
      
      // Batch 3: Load remaining genres after 1s
      setTimeout(() => {
        fetchMoviesByGenre('Romance', 1);
        fetchMoviesByGenre('Science Fiction', 1);
        fetchMoviesByGenre('Thriller', 1);
      }, 1000);
    }
  }, [genres, fetchMoviesByGenre]);

  // Handle search and category from URL parameters
  useEffect(() => {
 
    const categoryFromUrl = searchParams.get('category') || '';
    
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
      
      // Ensure category data is loaded for genre-based categories
      if (['action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi', 'thriller'].includes(categoryFromUrl)) {
        const genreNameMap: {[key: string]: string} = {
          'action': 'Action',
          'comedy': 'Comedy',
          'drama': 'Drama',
          'horror': 'Horror',
          'romance': 'Romance',
          'sci-fi': 'Science Fiction',
          'thriller': 'Thriller'
        };
        
        const genreName = genreNameMap[categoryFromUrl];
        if (genreName) {
          fetchMoviesByGenre(genreName, 1, false);
        }
      }
    }
  }, [searchParams, selectedCategory, fetchMoviesByGenre]);

  // Get movies based on selected category
  const getCategoryMovies = (category: string): Movie[] => {
    switch (category) {
      case 'latest':
        return movies.slice(0, 20); // Show latest from main movies
      case 'trending':
        return trendingMovies;
      case 'popular':
        return popularMovies;
      case 'top-rated':
        return topRatedMovies;
      case 'upcoming':
        return upcomingMovies;
      case 'action':
        return actionMovies;
      case 'comedy':
        return comedyMovies;
      case 'drama':
        return dramaMovies;
      case 'horror':
        return horrorMovies;
      case 'romance':
        return romanceMovies;
      case 'sci-fi':
        return sciFiMovies;
      case 'thriller':
        return thrillerMovies;
      default:
        return movies;
    }
  };


  const handlePlayMovie = (movie: Movie) => {
    console.log('Play movie:', movie.title);
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (!user) {
      showToast('Please log in to add movies to your watchlist', 'error');
      return;
    }
    
    try {
      await api.post(`/api/movies/${movie._id}/watchlist`);
      console.log(`Added "${movie.title}" to watchlist`);
      showToast(`"${movie.title}" added to watchlist!`, 'success');
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      if (error.response?.status === 401) {
        showToast('Please log in to add movies to your watchlist', 'error');
      } else if (error.response?.status === 400) {
        showToast('This movie is already in your watchlist!', 'error');
      } else {
        showToast('Failed to add movie to watchlist. Please try again.', 'error');
      }
    }
  };

  // Load more movies for a specific category with smart loading
  const loadMoreMovies = async (category: string) => {
    // Check if already loading this category
    if (loadingStates[category]) {
      console.log(`Already loading ${category}, skipping...`);
      return;
    }

    const newPage = categoryPages[category] + 1;
    const totalPages = Math.ceil((categoryTotals[category] || 0) / 20);
    
    // Check if we've reached the maximum pages
    if (newPage > totalPages) {
      console.log(`Reached max pages for ${category}: ${newPage} > ${totalPages}`);
      return;
    }

    // Set loading state for this category
    setLoadingStates(prev => ({ ...prev, [category]: true }));
    setCategoryPages(prev => ({ ...prev, [category]: newPage }));
    
    try {
      await fetchCategoryMovies(category, newPage, true);
    } catch (error) {
      console.error(`Error loading more ${category} movies:`, error);
    } finally {
      // Clear loading state for this category
      setLoadingStates(prev => ({ ...prev, [category]: false }));
    }
  };

  // Smart infinite scroll handler for horizontal sections
  const handleScroll = (e: React.UIEvent<HTMLDivElement>, category: string) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Calculate scroll percentage
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    const isNearEnd = scrollPercentage >= 0.8; // Trigger at 80% scroll
    
    // Throttle scroll events (only allow one per 500ms per category)
    const now = Date.now();
    const lastTime = lastScrollTime[category] || 0;
    if (now - lastTime < 500) {
      return;
    }
    setLastScrollTime(prev => ({ ...prev, [category]: now }));
    
    // Check if we're already loading this specific category to prevent multiple requests
    if (loadingStates[category]) {
      return;
    }
    
    // Check if user has scrolled near the end
    if (isNearEnd) {
      // Get current movies and totals
      let currentMovies: Movie[] = [];
      const totalMovies = categoryTotals[category] || 0;
      
      switch (category) {
        case 'trending':
          currentMovies = trendingMovies;
          break;
        case 'popular':
          currentMovies = popularMovies;
          break;
        case 'topRated':
          currentMovies = topRatedMovies;
          break;
        case 'upcoming':
          currentMovies = upcomingMovies;
          break;
        default:
          return;
      }
      
      // Smart loading conditions
      const hasMoreMovies = currentMovies.length < totalMovies;
      const hasReasonableAmount = currentMovies.length >= 20; // Ensure we have some content
      const isNotAtMaxPages = categoryPages[category] < Math.ceil(totalMovies / 20);
      
      console.log(`Smart scroll check for ${category}:`, {
        currentMovies: currentMovies.length,
        totalMovies,
        scrollPercentage: Math.round(scrollPercentage * 100) + '%',
        hasMoreMovies,
        hasReasonableAmount,
        isNotAtMaxPages,
        shouldLoad: hasMoreMovies && hasReasonableAmount && isNotAtMaxPages
      });
      
      if (hasMoreMovies && hasReasonableAmount && isNotAtMaxPages) {
        loadMoreMovies(category);
      }
    }
  };

  // Smart infinite scroll handler for genre sections
  const handleGenreScroll = (e: React.UIEvent<HTMLDivElement>, genreName: string) => {
    const element = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    
    // Calculate scroll percentage
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    const isNearEnd = scrollPercentage >= 0.8; // Trigger at 80% scroll
    
    // Throttle scroll events (only allow one per 500ms per genre)
    const now = Date.now();
    const lastTime = lastScrollTime[genreName] || 0;
    if (now - lastTime < 500) {
      return;
    }
    setLastScrollTime(prev => ({ ...prev, [genreName]: now }));
    
    // Check if we're already loading this specific genre to prevent multiple requests
    if (loadingStates[genreName]) {
      return;
    }
    
    // Check if user has scrolled near the end
    if (isNearEnd) {
      const genreKeyMap: {[key: string]: string} = {
        'Action': 'action',
        'Comedy': 'comedy', 
        'Drama': 'drama',
        'Horror': 'horror',
        'Romance': 'romance',
        'Science Fiction': 'sciFi',
        'Thriller': 'thriller'
      };
      
      const genreKey = genreKeyMap[genreName];
      if (genreKey) {
        let currentMovies: Movie[] = [];
        const totalMovies = categoryTotals[genreKey] || 0;
        
        switch (genreKey) {
          case 'action':
            currentMovies = actionMovies;
            break;
          case 'comedy':
            currentMovies = comedyMovies;
            break;
          case 'drama':
            currentMovies = dramaMovies;
            break;
          case 'horror':
            currentMovies = horrorMovies;
            break;
          case 'romance':
            currentMovies = romanceMovies;
            break;
          case 'sciFi':
            currentMovies = sciFiMovies;
            break;
          case 'thriller':
            currentMovies = thrillerMovies;
            break;
          default:
            return;
        }
        
        // Smart loading conditions
        const hasMoreMovies = currentMovies.length < totalMovies;
        const hasReasonableAmount = currentMovies.length >= 20; // Ensure we have some content
        const isNotAtMaxPages = genrePages[genreKey] < Math.ceil(totalMovies / 20);
        
        console.log(`Smart genre scroll check for ${genreName}:`, {
          currentMovies: currentMovies.length,
          totalMovies,
          scrollPercentage: Math.round(scrollPercentage * 100) + '%',
          hasMoreMovies,
          hasReasonableAmount,
          isNotAtMaxPages,
          shouldLoad: hasMoreMovies && hasReasonableAmount && isNotAtMaxPages
        });
        
        if (hasMoreMovies && hasReasonableAmount && isNotAtMaxPages) {
          loadMoreGenreMovies(genreName);
        }
      }
    }
  };



  return (
    <div className="min-h-screen bg-black">
      <div className=" p-6 space-y-8">
        {/* Search Results */}
        {isSearching && searchQuery && (
          <SearchResults
            query={searchQuery}
            filters={searchFilters}
            onPlay={handlePlayMovie}
            onAddToWatchlist={handleAddToWatchlist}
            watchlist={[]} // You might want to get this from context
            onFilterChange={(newFilters) => setSearchFilters(prev => ({ ...prev, ...newFilters }))}
          />
        )}

        {/* Category-specific content or general categories */}
        {!isSearching && selectedCategory ? (
          <div className="space-y-8">
            {/* Category Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent capitalize">
                  {selectedCategory.replace('-', ' ')} Movies
                </h2>
                <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
            </div>
              <p className="text-gray-400 text-lg">
                {getCategoryMovies(selectedCategory).length} movies available
              </p>
        </div>

            {/* Category Movies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categoryLoading ? (
                Array.from({ length: 20 }).map((_, index) => (
                  <MovieCardSkeleton key={index} />
                ))
              ) : getCategoryMovies(selectedCategory).length > 0 ? (
                getCategoryMovies(selectedCategory).map((movie) => (
                  <MovieCard
                    key={movie._id}
                    movie={movie}
                    onPlay={handlePlayMovie}
                    onAddToWatchlist={handleAddToWatchlist}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-400 text-lg">No movies found in this category</p>
          </div>
              )}
            </div>

            {/* Pagination for Category Pages */}
            {getCategoryMovies(selectedCategory).length > 0 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  onClick={async () => {
                    const newPage = categoryPages[selectedCategory] - 1;
                    if (newPage >= 1) {
                      setCategoryPages(prev => ({ ...prev, [selectedCategory]: newPage }));
                      setCategoryLoading(true);
                      
                      // Scroll to top smoothly
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      
                      // Check if it's a genre-based category
                      if (['action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi', 'thriller'].includes(selectedCategory)) {
                        const genreNameMap: {[key: string]: string} = {
                          'action': 'Action',
                          'comedy': 'Comedy',
                          'drama': 'Drama',
                          'horror': 'Horror',
                          'romance': 'Romance',
                          'sci-fi': 'Science Fiction',
                          'thriller': 'Thriller'
                        };
                        const genreName = genreNameMap[selectedCategory];
                        if (genreName) {
                          await fetchMoviesByGenre(genreName, newPage, false);
                        }
                      } else {
                        await fetchCategoryMovies(selectedCategory, newPage);
                      }
                    }
                  }}
                  disabled={categoryPages[selectedCategory] <= 1 || categoryLoading}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryLoading ? <LoadingSpinner size="sm" /> : 'Previous'}
                </Button>
                
                <span className="text-gray-300 text-sm">
                  Page {categoryPages[selectedCategory]} of {Math.ceil((categoryTotals[selectedCategory] || 0) / 20)}
                </span>
                
                <Button
                  onClick={async () => {
                    const newPage = categoryPages[selectedCategory] + 1;
                    const totalPages = Math.ceil((categoryTotals[selectedCategory] || 0) / 20);
                    if (newPage <= totalPages) {
                      setCategoryPages(prev => ({ ...prev, [selectedCategory]: newPage }));
                      setCategoryLoading(true);
                      
                      // Scroll to top smoothly
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      
                      // Check if it's a genre-based category
                      if (['action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi', 'thriller'].includes(selectedCategory)) {
                        const genreNameMap: {[key: string]: string} = {
                          'action': 'Action',
                          'comedy': 'Comedy',
                          'drama': 'Drama',
                          'horror': 'Horror',
                          'romance': 'Romance',
                          'sci-fi': 'Science Fiction',
                          'thriller': 'Thriller'
                        };
                        const genreName = genreNameMap[selectedCategory];
                        if (genreName) {
                          await fetchMoviesByGenre(genreName, newPage, false);
                        }
                      } else {
                        await fetchCategoryMovies(selectedCategory, newPage);
                      }
                    }
                  }}
                  disabled={categoryPages[selectedCategory] >= Math.ceil((categoryTotals[selectedCategory] || 0) / 20) || categoryLoading}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryLoading ? <LoadingSpinner size="sm" /> : 'Next'}
                </Button>
              </div>
            )}
          </div>
        ) : !isSearching && !searchQuery ? (
          <div className="space-y-8">
            {/* Netflix-style Category Sections */}
            {/* Latest Movies - Most Recent First */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Latest Movies</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4">
                  {categoryLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    [...trendingMovies, ...popularMovies, ...topRatedMovies, ...upcomingMovies]
                      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
                      .slice(0, 20)
                      .map((movie, index) => (
                        <div key={`latest-${movie._id}-${index}`} className="flex-shrink-0 w-64">
                          <MovieCard
                            movie={movie}
                            onPlay={handlePlayMovie}
                            onAddToWatchlist={handleAddToWatchlist}
                          />
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Trending Now */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Trending Now</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {trendingMovies.length} of {categoryTotals.trending} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleScroll(e, 'trending')}
                >
                  {categoryLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    trendingMovies.map((movie, index) => (
                      <div key={`trending-${movie._id}-${index}`} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Popular Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Popular Movies</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {popularMovies.length} of {categoryTotals.popular} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleScroll(e, 'popular')}
                >
                  {categoryLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    popularMovies.map((movie, index) => (
                      <div key={`popular-${movie._id}-${index}`} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Rated */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Top Rated</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {topRatedMovies.length} of {categoryTotals.topRated} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleScroll(e, 'topRated')}
                >
                  {categoryLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    topRatedMovies.map((movie, index) => (
                      <div key={`toprated-${movie._id}-${index}`} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Upcoming</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {upcomingMovies.length} of {categoryTotals.upcoming} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleScroll(e, 'upcoming')}
                >
                  {categoryLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    upcomingMovies.map((movie, index) => (
                      <div key={`upcoming-${movie._id}-${index}`} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Action Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Action Movies</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {actionMovies.length} of {categoryTotals.action} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleGenreScroll(e, 'Action')}
                >
                  {genreLoadingFlags['Action'] || actionMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    actionMovies.map((movie, index) => (
                      <div key={`action-${movie._id}-${index}`} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Comedy Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Comedy Movies</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {comedyMovies.length} of {categoryTotals.comedy} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleGenreScroll(e, 'Comedy')}
                >
                  {genreLoadingFlags['Comedy'] || comedyMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    comedyMovies.map((movie) => (
                      <div key={movie._id} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drama Movies */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Drama Movies</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              </div>
              <div className="relative">
                <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4">
                  {genreLoadingFlags['Drama'] || dramaMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    dramaMovies.map((movie) => (
                      <div key={movie._id} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Horror Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Horror Movies</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {horrorMovies.length} of {categoryTotals.horror} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleGenreScroll(e, 'Horror')}
                >
                  {genreLoadingFlags['Horror'] || horrorMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    horrorMovies.map((movie) => (
                      <div key={movie._id} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Romance Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Romance Movies</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                  <div className="text-gray-400 text-sm">
                  {romanceMovies.length} of {categoryTotals.romance} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleGenreScroll(e, 'Romance')}
                >
                  {genreLoadingFlags['Romance'] || romanceMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    romanceMovies.map((movie) => (
                      <div key={movie._id} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
                </div>
              </div>
              
            {/* Science Fiction Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Science Fiction</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {sciFiMovies.length} of {categoryTotals.sciFi} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleGenreScroll(e, 'Science Fiction')}
                >
                  {genreLoadingFlags['Science Fiction'] || sciFiMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    sciFiMovies.map((movie) => (
                      <div key={movie._id} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Thriller Movies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Thriller Movies</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <div className="text-gray-400 text-sm">
                  {thrillerMovies.length} of {categoryTotals.thriller} movies
                </div>
              </div>
              <div className="relative">
                <div 
                  className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
                  onScroll={(e) => handleGenreScroll(e, 'Thriller')}
                >
                  {genreLoadingFlags['Thriller'] || thrillerMovies.length === 0 ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-64">
                        <MovieCardSkeleton />
                      </div>
                    ))
                  ) : (
                    thrillerMovies.map((movie) => (
                      <div key={movie._id} className="flex-shrink-0 w-64">
                        <MovieCard
                          movie={movie}
                          onPlay={handlePlayMovie}
                          onAddToWatchlist={handleAddToWatchlist}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
};

export default MoviesPage;
