import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  Film,
  Tv,
  Search,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminContentManagementProps {
  contentType?: 'movies' | 'tvshows';
}

interface Movie {
  _id: string;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath: string;
  backdropPath: string;
  genres: Array<{ _id: string; name: string }>;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  isAvailable: boolean;
  vidsrcUrl?: string;
  streamingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface TvShow {
  _id: string;
  name: string;
  originalName?: string;
  overview: string;
  firstAirDate: string;
  lastAirDate?: string;
  posterPath: string;
  backdropPath: string;
  genres: Array<{ _id: string; name: string }>;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  isAvailable: boolean;
  status?: string;
  type?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  streamingUrl?: string;
  vidsrcUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminContentManagement: React.FC<AdminContentManagementProps> = ({ contentType: propContentType }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine content type from route or prop
  const getContentTypeFromRoute = (): 'movies' | 'tvshows' => {
    if (location.pathname.includes('/tvshows')) return 'tvshows';
    return 'movies';
  };
  
  const contentType = propContentType || getContentTypeFromRoute();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<TvShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genres, setGenres] = useState<Array<{ _id: string; name: string }>>([]);

  // Fetch genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await api.get('/api/genres');
        setGenres(response.data || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    
    fetchGenres();
  }, []);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(genreFilter && { genre: genreFilter }),
        ...(yearFilter && yearFilter !== 'all' && { year: yearFilter }),
        ...(availabilityFilter && { isAvailable: availabilityFilter }),
        sortBy,
        order: sortOrder
      });

      const response = await api.get(`/api/admin/movies?${params}`);
      setMovies(response.data.data.movies);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, genreFilter, yearFilter, availabilityFilter, sortBy, sortOrder]);

  const fetchTvShows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(genreFilter && { genre: genreFilter }),
        ...(yearFilter && yearFilter !== 'all' && { year: yearFilter }),
        ...(availabilityFilter && { isAvailable: availabilityFilter }),
        sortBy,
        order: sortOrder
      });

      console.log('Fetching TV shows with params:', params.toString());
      const response = await api.get(`/api/admin/tvshows?${params}`);
      console.log('TV Shows API Response:', response.data);
      
      if (response.data.success && response.data.data) {
        setTvShows(response.data.data.tvShows || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError('Invalid response format');
      }
    } catch (err: any) {
      console.error('Failed to fetch TV shows:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch TV shows');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, genreFilter, yearFilter, availabilityFilter, sortBy, sortOrder]);

  useEffect(() => {
    // Only fetch data if user has admin access
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      if (contentType === 'movies') {
        fetchMovies();
      } else {
        fetchTvShows();
      }
    }
  }, [user, contentType, fetchMovies, fetchTvShows]);

  const toggleMovieAvailability = async (movieId: string, isAvailable: boolean) => {
    try {
      await api.put(`/api/admin/movies/${movieId}/availability`, { isAvailable });
      setMovies(movies.map(movie => 
        movie._id === movieId ? { ...movie, isAvailable } : movie
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update movie availability');
    }
  };

  const deleteMovie = async (movieId: string) => {
    if (!window.confirm('Are you sure you want to delete this movie? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/api/admin/movies/${movieId}`);
      setMovies(movies.filter(movie => movie._id !== movieId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete movie');
    }
  };

  const deleteTvShow = async (tvShowId: string) => {
    if (!window.confirm('Are you sure you want to delete this TV show? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/api/admin/tvshows/${tvShowId}`);
      setTvShows(tvShows.filter(tvShow => tvShow._id !== tvShowId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete TV show');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvailabilityBadge = (isAvailable: boolean) => {
    return isAvailable ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Available
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Unavailable
      </span>
    );
  };

  if (loading && movies.length === 0 && tvShows.length === 0) {
    return (
      <LoadingSpinner fullScreen text="Loading content..." color="red" size="lg" />
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 ">
            {contentType === 'movies' ? (
              <div className="p-3 items-center bg-blue-500/20 rounded-full border border-blue-500/30">
                <Film className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              </div>
            ) : (
              <div className="p-3 items-center bg-blue-500/20 rounded-full border border-blue-500/30">
                <Tv className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 " />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                {contentType === 'movies' ? 'Movies' : 'TV Shows'} Management
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Manage {contentType === 'movies' ? 'movies' : 'TV shows'} and content availability
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-950 rounded-nonr shadow-sm border border-gray-900 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={contentType === 'movies' ? 'Search movies...' : 'Search TV shows...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-950 text-white outline-none rounded-none border-gray-800 focus:border-0 focus:ring-0 ring-offset-0 placeholder:text-gray-400"
                  />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Genre
              </label>
              <Select value={genreFilter || "all"} onValueChange={(value) => setGenreFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full bg-gray-950 text-white border-gray-800 rounded-none focus:ring-0 focus:border-0 ring-offset-0 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 text-white border-gray-800 rounded-none">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem 
                      key={genre._id} 
                      value={genre._id} 
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Year
              </label>
              <Select value={yearFilter || "all"} onValueChange={(value) => setYearFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full bg-gray-950 text-white border-gray-800 rounded-none focus:ring-0 focus:border-0 ring-offset-0 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 text-white border-gray-800 rounded-none">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Years</SelectItem>
                  <SelectItem value="2024" className="text-white hover:bg-gray-700 focus:bg-gray-700">2024</SelectItem>
                  <SelectItem value="2023" className="text-white hover:bg-gray-700 focus:bg-gray-700">2023</SelectItem>
                  <SelectItem value="2022" className="text-white hover:bg-gray-700 focus:bg-gray-700">2022</SelectItem>
                  <SelectItem value="2021" className="text-white hover:bg-gray-700 focus:bg-gray-700">2021</SelectItem>
                  <SelectItem value="2020" className="text-white hover:bg-gray-700 focus:bg-gray-700">2020</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Availability
              </label>
              <Select value={availabilityFilter || "all"} onValueChange={(value) => setAvailabilityFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full bg-gray-950 text-white border-gray-800 rounded-none focus:ring-0 focus:border-0 ring-offset-0 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 text-white border-gray-800 rounded-none">
                  <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All</SelectItem>
                  <SelectItem value="true" className="text-white hover:bg-gray-700 focus:bg-gray-700">Available</SelectItem>
                  <SelectItem value="false" className="text-white hover:bg-gray-700 focus:bg-gray-700">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sort By
              </label>
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-full bg-gray-950 text-white border-gray-800 rounded-none focus:ring-0 focus:border-0 ring-offset-0 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 text-white border-gray-800 rounded-none">
                  <SelectItem value="createdAt-desc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Oldest First</SelectItem>
                  <SelectItem value="title-asc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Title A-Z</SelectItem>
                  <SelectItem value="title-desc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Title Z-A</SelectItem>
                  <SelectItem value="popularity-desc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Most Popular</SelectItem>
                  <SelectItem value="voteAverage-desc" className="text-white hover:bg-gray-800 focus:bg-gray-800">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Error: {error}</p>
              </div>
            </div>
          )}

          {/* Movies Grid */}
        <div className="bg-gray-950 rounded-none shadow-sm border border-gray-900">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {contentType === 'movies' ? `Movies (${movies.length})` : `TV Shows (${tvShows.length})`}
              </h3>
              {/* <div className="flex space-x-3">
                <button 
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  aria-label="Sync content from external sources"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Sync Content</span>
                </button>
                <button 
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  aria-label={`Add new ${contentType === 'movies' ? 'movie' : 'TV show'} to the library`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add {contentType === 'movies' ? 'Movie' : 'TV Show'}</span>
                </button>
              </div> */}
            </div>
          </div>

          <div className="p-6">
            {contentType === 'movies' ? (
              movies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {movies.map((movie) => (
                    <div key={movie._id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden hover:shadow-2xl hover:border-gray-600/50 transition-all duration-300 group transform hover:-translate-y-1">
                      <div className="relative overflow-hidden">
                        <img
                          src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
                          alt={movie.title}
                          className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Full Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                          <h4 className="font-bold text-white text-lg leading-tight">
                            {movie.title}
                          </h4>
                        </div>
                        
                        {/* Availability Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          {getAvailabilityBadge(movie.isAvailable)}
                        </div>
                        
                        {/* Rating Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="flex items-center bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                            <span className="text-xs text-white font-semibold ml-1">
                              {movie.voteAverage.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Hover Overlay with Quick Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <button
                              onClick={() => toggleMovieAvailability(movie._id, !movie.isAvailable)}
                              className={`p-3 rounded-full backdrop-blur-sm transition-all duration-200 ${
                                movie.isAvailable 
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300' 
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300'
                              }`}
                              title={movie.isAvailable ? 'Make Unavailable' : 'Make Available'}
                            >
                              {movie.isAvailable ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => deleteMovie(movie._id)}
                              className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 backdrop-blur-sm transition-all duration-200"
                              title="Delete Movie"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5" />
                              <span>{new Date(movie.releaseDate).getFullYear()}</span>
                            </div>
                            <div className="text-xs bg-gray-700/50 px-2 py-1 rounded-full">
                              {formatDate(movie.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {movie.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre._id}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100 shadow-sm"
                            >
                              {genre.name}
                            </span>
                          ))}
                          {movie.genres.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 shadow-sm">
                              +{movie.genres.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${movie.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className={`text-xs font-medium ${movie.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                              {movie.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {movie._id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <Film className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">No movies found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">Try adjusting your search or filter criteria to discover more content</p>
                </div>
              )
            ) : (
              tvShows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {tvShows.map((tvShow) => (
                    <div key={tvShow._id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden hover:shadow-2xl hover:border-gray-600/50 transition-all duration-300 group transform hover:-translate-y-1">
                      <div className="relative overflow-hidden">
                        <img
                          src={tvShow.posterPath ? `https://image.tmdb.org/t/p/w500${tvShow.posterPath}` : '/placeholder-movie.jpg'}
                          alt={tvShow.name}
                          className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Full Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                          <h4 className="font-bold text-white text-lg leading-tight">
                            {tvShow.name}
                          </h4>
                        </div>
                        
                        {/* Availability Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          {getAvailabilityBadge(tvShow.isAvailable)}
                        </div>
                        
                        {/* Rating Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className="flex items-center bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                            <span className="text-xs text-white font-semibold ml-1">
                              {tvShow.voteAverage.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Hover Overlay with Quick Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <button
                              onClick={async () => {
                                try {
                                  await api.put(`/api/admin/tvshows/${tvShow._id}/availability`, { isAvailable: !tvShow.isAvailable });
                                  setTvShows(tvShows.map(show => 
                                    show._id === tvShow._id ? { ...show, isAvailable: !show.isAvailable } : show
                                  ));
                                } catch (err: any) {
                                  setError(err.response?.data?.message || 'Failed to update TV show availability');
                                }
                              }}
                              className={`p-3 rounded-full backdrop-blur-sm transition-all duration-200 ${
                                tvShow.isAvailable 
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300' 
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300'
                              }`}
                              title={tvShow.isAvailable ? 'Make Unavailable' : 'Make Available'}
                            >
                              {tvShow.isAvailable ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => deleteTvShow(tvShow._id)}
                              className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 backdrop-blur-sm transition-all duration-200"
                              title="Delete TV Show"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5" />
                              <span>{tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear() : 'N/A'}</span>
                            </div>
                            <div className="text-xs bg-gray-700/50 px-2 py-1 rounded-full">
                              {formatDate(tvShow.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tvShow.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre._id}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100 shadow-sm"
                            >
                              {genre.name}
                            </span>
                          ))}
                          {tvShow.genres.length > 2 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 shadow-sm">
                              +{tvShow.genres.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${tvShow.isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className={`text-xs font-medium ${tvShow.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                              {tvShow.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {tvShow._id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <Tv className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">No TV shows found</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">Try adjusting your search or filter criteria to discover more content</p>
                  {error && (
                    <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/50 rounded-xl p-4 max-w-md mx-auto backdrop-blur-sm">
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-300">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContentManagement;
