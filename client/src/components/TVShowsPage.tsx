import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import TVShowCard from './TvShowCard';
import TvShowCardSkeleton from './TvShowCardSkeleton';
import LoadingSpinner from './LoadingSpinner';
// import AdvancedSearch from './AdvancedSearch';
import TVShowSearchResults from './TVShowSearchResults';
import { Button } from './ui/button';
import { 
  Tv, 
  TrendingUp, 
  Star, 
  Calendar, 
  Filter,
  Play,
  Plus,
  Clock,
  Users,
  Award
} from 'lucide-react';
import api from '../services/api';

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

interface Genre {
  _id: string;
  name: string;
  tmdbId?: number;
}

interface SearchFilters {
  query: string;
  genres: string[];
  year: string;
  rating: string;
  sortBy: string;
  order: 'asc' | 'desc';
  status?: string;
  type?: string;
}

const TVShowsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresWithCounts, setGenresWithCounts] = useState<Array<Genre & { tvShowCount: number }>>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Category states
  const [trendingTvShows, setTrendingTvShows] = useState<TVShow[]>([]);
  const [popularTvShows, setPopularTvShows] = useState<TVShow[]>([]);
  const [topRatedTvShows, setTopRatedTvShows] = useState<TVShow[]>([]);
  const [comedyTvShows, setComedyTvShows] = useState<TVShow[]>([]);
  const [dramaTvShows, setDramaTvShows] = useState<TVShow[]>([]);
  const [animationTvShows, setAnimationTvShows] = useState<TVShow[]>([]);
  const [crimeTvShows, setCrimeTvShows] = useState<TVShow[]>([]);
  const [sciFiFantasyTvShows, setSciFiFantasyTvShows] = useState<TVShow[]>([]);
  const [actionAdventureTvShows, setActionAdventureTvShows] = useState<TVShow[]>([]);
  const [mysteryTvShows, setMysteryTvShows] = useState<TVShow[]>([]);

  // Pagination state for each category
  const [categoryPages, setCategoryPages] = useState<{[key: string]: number}>({
    trending: 1,
    popular: 1,
    'top-rated': 1,
    comedy: 1,
    drama: 1,
    animation: 1,
    crime: 1,
    'sci-fi-fantasy': 1,
    'action-adventure': 1,
    mystery: 1
  });

  const [categoryTotals, setCategoryTotals] = useState<{[key: string]: number}>({
    trending: 0,
    popular: 0,
    'top-rated': 0,
    comedy: 0,
    drama: 0,
    animation: 0,
    crime: 0,
    'sci-fi-fantasy': 0,
    'action-adventure': 0,
    mystery: 0,
    family: 0,
    reality: 0,
    kids: 0,
    documentary: 0,
    soap: 0,
    talk: 0,
    'war-politics': 0,
    western: 0,
    news: 0
  });

  // Additional genre state variables
  const [familyTvShows, setFamilyTvShows] = useState<TVShow[]>([]);
  const [realityTvShows, setRealityTvShows] = useState<TVShow[]>([]);
  const [kidsTvShows, setKidsTvShows] = useState<TVShow[]>([]);
  const [documentaryTvShows, setDocumentaryTvShows] = useState<TVShow[]>([]);
  const [soapTvShows, setSoapTvShows] = useState<TVShow[]>([]);
  const [talkTvShows, setTalkTvShows] = useState<TVShow[]>([]);
  const [warPoliticsTvShows, setWarPoliticsTvShows] = useState<TVShow[]>([]);
  const [westernTvShows, setWesternTvShows] = useState<TVShow[]>([]);
  const [newsTvShows, setNewsTvShows] = useState<TVShow[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    genres: [],
    year: 'all',
    rating: 'all',
    sortBy: 'popularity',
    order: 'desc',
    status: 'all',
    type: 'all'
  });

  const [watchlist, setWatchlist] = useState<string[]>([]);
  
  // Dynamic TV shows storage by genre slug
  const [tvShowsByGenreSlug, setTvShowsByGenreSlug] = useState<{[key: string]: TVShow[]}>({});
  const [pagesByGenreSlug, setPagesByGenreSlug] = useState<{[key: string]: number}>({});
  const [totalsByGenreSlug, setTotalsByGenreSlug] = useState<{[key: string]: number}>({});

  // Fetch user's watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/api/watchlist');
      const watchlistItems = response.data.watchlist || [];
      const tvShowIds = watchlistItems
        .filter((item: any) => item.tvShow)
        .map((item: any) => item.tvShow._id);
      setWatchlist(tvShowIds);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      // Don't show alert for watchlist fetch errors as it's not critical
    }
  }, [user]);

  const selectedCategory = useMemo(() => searchParams.get('category') || 'trending', [searchParams]);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    try {
      const response = await api.get('/api/genres');
      setGenres(response.data);
      
      // Also fetch genres with TV show counts for category buttons
      const countsResponse = await api.get('/api/genres/with-counts');
      setGenresWithCounts(countsResponse.data);
      console.log('Genres with counts:', countsResponse.data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  }, []);

  // Fetch TV shows by category
  const fetchCategoryTvShows = useCallback(async (category: string, page: number = 1) => {
    try {
      setCategoryLoading(true);
      let response;
      
      switch (category) {
        case 'trending':
          response = await api.get(`/api/tvshows/trending?limit=20&page=${page}`);
          break;
        case 'popular':
          response = await api.get(`/api/tvshows/popular?limit=20&page=${page}`);
          break;
        case 'top-rated':
          response = await api.get(`/api/tvshows/top-rated?limit=20&page=${page}`);
          break;
        default:
          response = await api.get(`/api/tvshows?limit=20&page=${page}`);
      }

      const tvShows = response.data.tvShows || [];
      const total = response.data.total || 0;

      // Map category names to setters
      const categoryMap: {[key: string]: any} = {
        'trending': { setter: setTrendingTvShows, key: 'trending' },
        'popular': { setter: setPopularTvShows, key: 'popular' },
        'top-rated': { setter: setTopRatedTvShows, key: 'topRated' }
      };

      const categoryInfo = categoryMap[category];
      if (categoryInfo) {
        categoryInfo.setter(tvShows);
        setCategoryTotals(prev => ({ ...prev, [categoryInfo.key]: total }));
      }
    } catch (error) {
      console.error(`Error fetching ${category} TV shows:`, error);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // Fetch TV shows by genre
  const fetchTvShowsByGenre = useCallback(async (genreName: string, page: number = 1, append: boolean = false) => {
    try {
      console.log(`Fetching ${genreName} TV shows, page ${page}, append: ${append}`);
      
      if (genres.length === 0) {
        console.log('Genres not loaded yet, retrying in 1 second...');
        setTimeout(() => fetchTvShowsByGenre(genreName, page, append), 1000);
        return;
      }

      // First try exact match (case insensitive)
      let genre = genres.find(g => 
        g.name.toLowerCase() === genreName.toLowerCase() && g.tmdbId
      );
      
      // If no exact match, try fuzzy matching (but prefer longest match)
      if (!genre) {
        const matchingGenres = genres.filter(g => 
          g.name.toLowerCase().includes(genreName.toLowerCase()) ||
          genreName.toLowerCase().includes(g.name.toLowerCase())
        );
        
        // Among matches, prefer the one that matches more of the search term
        genre = matchingGenres.reduce((best, current) => {
          if (!best) return current;
          const bestScore = best.name.toLowerCase().includes(genreName.toLowerCase()) ? genreName.length : 0;
          const currentScore = current.name.toLowerCase().includes(genreName.toLowerCase()) ? genreName.length : 0;
          
          // Prefer exact or longer matching names with tmdbId
          if (current.tmdbId && currentScore >= bestScore) return current;
          if (best.tmdbId) return best;
          return current;
        });
      }
      
      if (genre) {
        console.log(`Found genre: ${genre.name} (ID: ${genre._id})`);
        const response = await api.get(`/api/tvshows?genre=${genre._id}&limit=20&page=${page}`);
        console.log(`API response for ${genreName}:`, response.data);
        console.log(`TV shows count:`, (response.data.tvShows || []).length);
        
        const genreMap: {[key: string]: any} = {
          'Comedy': { setter: setComedyTvShows, key: 'comedy' },
          'Drama': { setter: setDramaTvShows, key: 'drama' },
          'Animation': { setter: setAnimationTvShows, key: 'animation' },
          'Crime': { setter: setCrimeTvShows, key: 'crime' },
          'Sci-Fi & Fantasy': { setter: setSciFiFantasyTvShows, key: 'sciFiFantasy' },
          'Action & Adventure': { setter: setActionAdventureTvShows, key: 'actionAdventure' },
          'Mystery': { setter: setMysteryTvShows, key: 'mystery' },
          'Family': { setter: setFamilyTvShows, key: 'family' },
          'Reality': { setter: setRealityTvShows, key: 'reality' },
          'Kids': { setter: setKidsTvShows, key: 'kids' },
          'Documentary': { setter: setDocumentaryTvShows, key: 'documentary' },
          'Soap': { setter: setSoapTvShows, key: 'soap' },
          'Talk': { setter: setTalkTvShows, key: 'talk' },
          'War & Politics': { setter: setWarPoliticsTvShows, key: 'warPolitics' },
          'Western': { setter: setWesternTvShows, key: 'western' },
          'News': { setter: setNewsTvShows, key: 'news' }
        };

        // Store TV shows by genre slug dynamically
        const genreSlug = genreToSlug(genre.name);
        console.log(`Storing TV shows for genre slug: "${genreSlug}"`);
        
        if (append) {
          setTvShowsByGenreSlug(prev => ({
            ...prev,
            [genreSlug]: [...(prev[genreSlug] || []), ...(response.data.tvShows || [])]
          }));
        } else {
          setTvShowsByGenreSlug(prev => ({
            ...prev,
            [genreSlug]: response.data.tvShows || []
          }));
        }
        
        setTotalsByGenreSlug(prev => ({
          ...prev,
          [genreSlug]: response.data.total || 0
        }));
        
        // Initialize page for this genre if not set
        setPagesByGenreSlug(prev => ({
          ...prev,
          [genreSlug]: page
        }));
        
        console.log(`Successfully updated ${genreSlug} with ${(response.data.tvShows || []).length} TV shows`);
      } else {
        console.log(`Genre "${genreName}" not found. Available genres:`, genres.map(g => g.name));
        const fallbackResponse = await api.get(`/api/tvshows/popular?limit=20&page=${page}`);
        
        const genreMap: {[key: string]: any} = {
          'Comedy': { setter: setComedyTvShows, key: 'comedy' },
          'Drama': { setter: setDramaTvShows, key: 'drama' },
          'Animation': { setter: setAnimationTvShows, key: 'animation' },
          'Crime': { setter: setCrimeTvShows, key: 'crime' },
          'Sci-Fi & Fantasy': { setter: setSciFiFantasyTvShows, key: 'sciFiFantasy' },
          'Action & Adventure': { setter: setActionAdventureTvShows, key: 'actionAdventure' },
          'Mystery': { setter: setMysteryTvShows, key: 'mystery' },
          'Family': { setter: setFamilyTvShows, key: 'family' },
          'Reality': { setter: setRealityTvShows, key: 'reality' },
          'Kids': { setter: setKidsTvShows, key: 'kids' },
          'Documentary': { setter: setDocumentaryTvShows, key: 'documentary' },
          'Soap': { setter: setSoapTvShows, key: 'soap' },
          'Talk': { setter: setTalkTvShows, key: 'talk' },
          'War & Politics': { setter: setWarPoliticsTvShows, key: 'warPolitics' },
          'Western': { setter: setWesternTvShows, key: 'western' },
          'News': { setter: setNewsTvShows, key: 'news' }
        };

        // For fallback, try to find by genre name
        const genreInfo = genreMap[genreName];
        if (genreInfo) {
          genreInfo.setter(fallbackResponse.data.tvShows || []);
          setCategoryTotals(prev => ({ ...prev, [genreInfo.key]: fallbackResponse.data.total || 0 }));
          console.log(`Fallback successful for ${genreInfo.key}`);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${genreName} TV shows:`, error);
    } finally {
      setCategoryLoading(false);
    }
  }, [genres]);

  // Get TV shows for selected category
  const getCategoryTvShows = (category: string): TVShow[] => {
    // Check special categories first
    switch (category) {
      case 'trending': return trendingTvShows;
      case 'popular': return popularTvShows;
      case 'top-rated': return topRatedTvShows;
    }
    
    // Check dynamic genre storage
    if (tvShowsByGenreSlug[category]) {
      return tvShowsByGenreSlug[category];
    }
    
    // Fallback to old hardcoded genres (will be removed eventually)
    switch (category) {
      case 'comedy': return comedyTvShows;
      case 'drama': return dramaTvShows;
      case 'animation': return animationTvShows;
      case 'crime': return crimeTvShows;
      case 'sci-fi-fantasy': return sciFiFantasyTvShows;
      case 'action-adventure': return actionAdventureTvShows;
      case 'mystery': return mysteryTvShows;
      default: return [];
    }
  };

  // Handle search
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setSearchQuery(filters.query);
    setIsSearching(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClearSearch = () => {
    setSearchFilters({
      query: '',
      genres: [],
      year: 'all',
      rating: 'all',
      sortBy: 'popularity',
      order: 'desc',
      status: 'all',
      type: 'all'
    });
    setSearchQuery('');
    setIsSearching(false);
  };

  // Handle play TV show
  const handlePlayTvShow = (tvShow: TVShow) => {
    if (tvShow.vidsrcUrl) {
      window.open(tvShow.vidsrcUrl, '_blank');
    } else if (tvShow.streamingUrl) {
      window.open(tvShow.streamingUrl, '_blank');
    } else {
      console.log('No streaming URL available for this TV show');
    }
  };

  // Handle add to watchlist
  const handleAddToWatchlist = async (tvShow: TVShow) => {
    if (!user) {
      showToast('Please log in to add TV shows to your watchlist', 'error');
      return;
    }
    
    try {
      await api.post(`/api/watchlist/tvshows/${tvShow._id}`);
      console.log(`Added "${tvShow.name}" to watchlist`);
      setWatchlist(prev => [...prev, tvShow._id]);
      showToast(`"${tvShow.name}" added to watchlist!`, 'success');
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      if (error.response?.status === 401) {
        showToast('Please log in to add TV shows to your watchlist', 'error');
      } else if (error.response?.status === 400) {
        showToast('This TV show is already in your watchlist!', 'error');
      } else {
        showToast('Failed to add TV show to watchlist. Please try again.', 'error');
      }
      throw error; // Re-throw to let the card handle the error state
    }
  };

  // Handle remove from watchlist
  const handleRemoveFromWatchlist = async (tvShow: TVShow) => {
    if (!user) {
      showToast('Please log in to manage your watchlist', 'error');
      return;
    }
    
    try {
      await api.delete(`/api/watchlist/tvshows/${tvShow._id}`);
      console.log(`Removed "${tvShow.name}" from watchlist`);
      setWatchlist(prev => prev.filter(id => id !== tvShow._id));
      showToast(`"${tvShow.name}" removed from watchlist!`, 'success');
    } catch (error: any) {
      console.error('Error removing from watchlist:', error);
      if (error.response?.status === 401) {
        showToast('Please log in to manage your watchlist', 'error');
      } else {
        showToast('Failed to remove TV show from watchlist. Please try again.', 'error');
      }
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Load all categories on initial mount
  useEffect(() => {
    // Fetch all category-based TV shows
    fetchCategoryTvShows('trending');
    fetchCategoryTvShows('popular');
    fetchCategoryTvShows('top-rated');
  }, [fetchCategoryTvShows]);

  // Load genre-based categories after genres are loaded (fetch top 7 genres)
  useEffect(() => {
    if (genres.length > 0 && genresWithCounts.length > 0) {
      console.log('Genres with counts loaded, fetching top genres from database...');
      // Fetch top 7 genres dynamically from database
      genresWithCounts.slice(0, 7).forEach(genre => {
        console.log(`Fetching ${genre.name} (${genre.tvShowCount} shows)...`);
        fetchTvShowsByGenre(genre.name);
      });
    }
  }, [genres.length, genresWithCounts.length, fetchTvShowsByGenre]);

  // Fetch TV shows when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    
    if (['trending', 'popular', 'top-rated'].includes(selectedCategory)) {
      // Load category-based TV shows if not already loaded
      const categoryData = getCategoryTvShows(selectedCategory);
      if (categoryData.length === 0) {
        fetchCategoryTvShows(selectedCategory);
      }
    } else {
      // Check if selectedCategory is a genre from genresWithCounts
      const genreFromSelected = genresWithCounts.find(g => genreToSlug(g.name) === selectedCategory);
      
      if (genreFromSelected) {
        // Load genre-based TV shows if not already loaded
        const genreData = getCategoryTvShows(selectedCategory);
        if (genres.length > 0 && genreData.length === 0) {
          console.log('Fetching TV shows for:', genreFromSelected.name);
          fetchTvShowsByGenre(genreFromSelected.name);
        }
      }
    }
  }, [selectedCategory, genres.length, genresWithCounts.length, fetchTvShowsByGenre]);

  // Helper function to convert genre name to URL slug
  const genreToSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/&/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  // Build category items dynamically from database
  const categoryItems = useMemo(() => {
    const baseCategories = [
      { label: 'Trending', path: '/tvshows?category=trending', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Popular', path: '/tvshows?category=popular', icon: <Star className="w-4 h-4" /> },
      { label: 'Top Rated', path: '/tvshows?category=top-rated', icon: <Award className="w-4 h-4" /> }
    ];

    // Add top genres from database (limit to top 7 to keep UI clean)
    const topGenres = genresWithCounts.slice(0, 7).map(genre => ({
      label: genre.name,
      path: `/tvshows?category=${genreToSlug(genre.name)}`,
      icon: <Tv className="w-4 h-4" />,
      count: genre.tvShowCount,
      genreId: genre._id
    }));

    return [...baseCategories, ...topGenres];
  }, [genresWithCounts]);

  return (
    <div className="min-h-screen bg-black text-white ">
      <div className=" p-6 space-y-8">
     

        {/* Advanced Search - Temporarily Removed */}
        {/* <div className="mb-8">
          <AdvancedSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
            genres={genres}
            className="mb-6"
          />
        </div> */}

        {/* Search Results */}
        {isSearching && searchQuery && (
          <TVShowSearchResults
            query={searchQuery}
            filters={searchFilters}
            onPlay={handlePlayTvShow}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            watchlist={watchlist}
          />
        )}

        {/* Category Navigation */}
        {!isSearching && !searchQuery && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categoryItems.map((item) => (
                <Button
                  key={item.path}
                  variant={selectedCategory === item.path.split('=')[1] ? "default" : "outline"}
                  onClick={() => setSearchParams({ category: item.path.split('=')[1] })}
                  className={`transition-all duration-200 ${
                    selectedCategory === item.path.split('=')[1]
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                      : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Category Content */}
        {!isSearching && !searchQuery && (
          <div className="space-y-8">
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">
                  {categoryItems.find(item => item.path.split('=')[1] === selectedCategory)?.label || 'TV Shows'}
                </h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                <p className="text-gray-400 text-lg">
                  {getCategoryTvShows(selectedCategory).length} TV shows available
                </p>
              </div>
            </div>

            {/* TV Shows Grid */}
            {categoryLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 20 }).map((_, index) => (
                  <div key={index} className="w-full h-80 bg-gray-800 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : getCategoryTvShows(selectedCategory).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {getCategoryTvShows(selectedCategory).map((tvShow) => (
                  <TVShowCard
                    key={tvShow._id}
                    tvShow={tvShow}
                    onPlay={handlePlayTvShow}
                    onAddToWatchlist={handleAddToWatchlist}
                    onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    isInWatchlist={watchlist.includes(tvShow._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">No TV shows found in this category</p>
              </div>
            )}

            {/* Pagination for Category Pages */}
            {getCategoryTvShows(selectedCategory).length > 0 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  onClick={async () => {
                    const currentPage = pagesByGenreSlug[selectedCategory] || categoryPages[selectedCategory] || 1;
                    const newPage = currentPage - 1;
                    if (newPage >= 1) {
                      setPagesByGenreSlug(prev => ({ ...prev, [selectedCategory]: newPage }));
                      setCategoryPages(prev => ({ ...prev, [selectedCategory]: newPage }));
                      setCategoryLoading(true);
                      
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      
                      // Check if it's a genre or a category
                      const genreFromSelected = genresWithCounts.find(g => genreToSlug(g.name) === selectedCategory);
                      if (genreFromSelected) {
                        await fetchTvShowsByGenre(genreFromSelected.name, newPage, false);
                      } else {
                        await fetchCategoryTvShows(selectedCategory, newPage);
                      }
                    }
                  }}
                  disabled={(pagesByGenreSlug[selectedCategory] || categoryPages[selectedCategory] || 1) <= 1 || categoryLoading}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryLoading ? <LoadingSpinner size="sm" /> : 'Previous'}
                </Button>
                
                <span className="text-gray-300 text-sm">
                  Page {(pagesByGenreSlug[selectedCategory] || categoryPages[selectedCategory]) || 1} of {Math.ceil((totalsByGenreSlug[selectedCategory] || categoryTotals[selectedCategory] || 0) / 20)}
                </span>
                
                <Button
                  onClick={async () => {
                    const currentPage = pagesByGenreSlug[selectedCategory] || categoryPages[selectedCategory] || 1;
                    const newPage = currentPage + 1;
                    const totalPages = Math.ceil((totalsByGenreSlug[selectedCategory] || categoryTotals[selectedCategory] || 0) / 20);
                      if (newPage <= totalPages) {
                      setPagesByGenreSlug(prev => ({ ...prev, [selectedCategory]: newPage }));
                      setCategoryPages(prev => ({ ...prev, [selectedCategory]: newPage }));
                      setCategoryLoading(true);
                      
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      
                      // Check if it's a genre or a category
                      const genreFromSelected = genresWithCounts.find(g => genreToSlug(g.name) === selectedCategory);
                      if (genreFromSelected) {
                        await fetchTvShowsByGenre(genreFromSelected.name, newPage, false);
                      } else {
                        await fetchCategoryTvShows(selectedCategory, newPage);
                      }
                    }
                  }}
                  disabled={(pagesByGenreSlug[selectedCategory] || categoryPages[selectedCategory] || 1) >= Math.ceil((totalsByGenreSlug[selectedCategory] || categoryTotals[selectedCategory] || 0) / 20) || categoryLoading}
                  variant="outline"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryLoading ? <LoadingSpinner size="sm" /> : 'Next'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TVShowsPage;
