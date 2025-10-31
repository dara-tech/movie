import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Play, Star, Calendar, Clock, Users, Film, ChevronDown, ChevronUp, TrendingUp, MessageSquare, Video, Images } from 'lucide-react';
import streamingService, { StreamingOption } from '../services/streamingService';
import MoviePlayer from './MoviePlayer';
import { MovieSEO } from './SEO';

interface Movie {
  _id: string;
  tmdbId: number;
  imdbId?: string;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath?: string;
  backdropPath?: string;
  voteAverage: number;
  voteCount: number;
  runtime?: number;
  genres: Array<{ name: string }>;
  originalLanguage: string;
  originalTitle: string;
  adult: boolean;
  popularity: number;
  video: boolean;
  streamingUrl?: string;
  vidsrcUrl?: string;
  isAvailable: boolean;
}

interface Cast {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
  order: number;
}

interface Crew {
  id: number;
  name: string;
  job: string;
  profilePath?: string;
}

interface SimilarMovie {
  _id: string;
  title: string;
  posterPath?: string;
  releaseDate: string;
  voteAverage: number;
}

interface Review {
  _id: string;
  user: {
    username: string;
    createdAt: string;
  };
  rating: number;
  review: string;
  addedAt: string;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
}

interface Image {
  filePath: string;
  aspectRatio: number;
  height: number;
  width: number;
  voteAverage: number;
  voteCount: number;
}


const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStreaming, setSelectedStreaming] = useState<StreamingOption | null>(null);
  const [streamingOptions, setStreamingOptions] = useState<StreamingOption[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);
  const [cast, setCast] = useState<Cast[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [castLoading, setCastLoading] = useState(false);
  const [expandedCast, setExpandedCast] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [videos, setVideos] = useState<any>({});
  const [videosLoading, setVideosLoading] = useState(false);
  const [images, setImages] = useState<any>({});
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const fetchMovie = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/movies/${id}`);
      const movieData = response.data;
      setMovie(movieData);
      
      // Generate all streaming options using the service (synchronous for better performance)
      const options: StreamingOption[] = streamingService.generateMovieStreamingOptionsSync(movieData);
      
      setStreamingOptions(options);
      if (options.length > 0) {
        setSelectedStreaming(options[0]);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCast = useCallback(async () => {
    if (!id) return;
    try {
      setCastLoading(true);
      const response = await api.get(`/api/movies/${id}/cast`);
      setCast(response.data.cast);
      setCrew(response.data.crew);
    } catch (error) {
      console.error('Error fetching cast:', error);
    } finally {
      setCastLoading(false);
    }
  }, [id]);

  const fetchSimilarMovies = useCallback(async () => {
    if (!id) return;
    try {
      setSimilarLoading(true);
      const response = await api.get(`/api/movies/${id}/similar`);
      setSimilarMovies(response.data.movies);
    } catch (error) {
      console.error('Error fetching similar movies:', error);
    } finally {
      setSimilarLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const response = await api.get(`/api/movies/${id}/reviews`);
      setReviews(response.data.reviews);
      setReviewStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const fetchVideos = useCallback(async () => {
    if (!id) return;
    try {
      setVideosLoading(true);
      const response = await api.get(`/api/movies/${id}/videos`);
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setVideosLoading(false);
    }
  }, [id]);

  const fetchImages = useCallback(async () => {
    if (!id) return;
    try {
      setImagesLoading(true);
      const response = await api.get(`/api/movies/${id}/images`);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setImagesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMovie();
      fetchCast();
      fetchSimilarMovies();
      fetchReviews();
      fetchVideos();
      fetchImages();
    }
  }, [id, fetchMovie, fetchCast, fetchSimilarMovies, fetchReviews, fetchVideos, fetchImages]);

  const handleStreamingChange = useCallback((option: StreamingOption) => {
    setSelectedStreaming(option);
  }, []);

  const isUpcoming = useCallback(() => {
    if (!movie) return false;
    const releaseDate = new Date(movie.releaseDate);
    const currentDate = new Date();
    return releaseDate > currentDate;
  }, [movie]);

  const handlePlay = useCallback(() => {
    if (isUpcoming()) return; // Don't allow play for upcoming movies
    
    // Show the MoviePlayer
    setShowPlayer(true);
  }, [isUpcoming]);

  const handleWatchComplete = useCallback((watchedMovie: any) => {
    console.log('Watch complete:', watchedMovie);
    // You can add logic here to update watch history, etc.
  }, []);

  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false);
  }, []);

  // const handleAddToWatchlist = async () => {
  //   try {
  //     await api.post('/api/watchlist', { movieId: movie?._id });
  //     // You can add a toast notification here
  //     console.log('Added to watchlist');
  //   } catch (error) {
  //     console.error('Error adding to watchlist:', error);
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* SEO Meta Tags */}
      {movie && (
        <MovieSEO 
          movie={{
            title: movie.title,
            overview: movie.overview,
            releaseDate: movie.releaseDate,
            posterPath: movie.posterPath,
            backdropPath: movie.backdropPath,
            genres: movie.genres,
            voteAverage: movie.voteAverage,
            runtime: movie.runtime,
            imdbId: movie.imdbId,
            tmdbId: movie.tmdbId
          }}
        />
      )}
      
      {/* Netflix-style Hero Section */}
      <div className="relative h-screen bg-cover bg-center bg-no-repeat" 
           style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1920${movie.backdropPath})` }}>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              {/* Movie Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
                {movie.title}
              </h1>
              
              {/* Movie Info */}
              <div className="flex items-center gap-6 mb-6 text-white">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold">{movie.voteAverage.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg">{new Date(movie.releaseDate).getFullYear()}</span>
                </div>
                {movie.runtime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">{movie.runtime} min</span>
                  </div>
                )}
                <div className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded">
                  HD
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.slice(0, 3).map((genre, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-800/80 text-white border-gray-600">
                    {genre.name}
                  </Badge>
                ))}
              </div>

              {/* Overview */}
              <p className="text-white text-lg leading-relaxed mb-8 max-w-xl">
                {movie.overview}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                {!isUpcoming() ? (
                  <Button
                    onClick={handlePlay}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    <Play className="w-6 h-6 fill-current mr-2" />
                    Play
                  </Button>
                ) : (
                  <div className="bg-purple-600 text-white px-8 py-3 text-lg font-semibold rounded-md flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-sm">📅</span>
                    </div>
                    Coming Soon - {new Date(movie.releaseDate).toLocaleDateString()}
                  </div>
                )}
                {/* <Button
                  onClick={handleAddToWatchlist}
                  variant="outline"
                  className="border-gray-400 text-white hover:bg-white/20 text-lg px-8 py-3 rounded-md font-semibold flex items-center gap-2"
                >
                  <Plus className="w-6 h-6" />
                  My List
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Netflix-style Content Sections */}
      <div className="bg-black">
        {/* Back Button */}
        {/* <div className="container mx-auto px-6 py-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-gray-600 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div> */}

        {/* Streaming Options Section */}
        <div className="container mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to Watch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {streamingOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedStreaming?.id === option.id ? "default" : "outline"}
                className={`
                  relative h-20 p-4 transition-all duration-300 ease-out
                  ${selectedStreaming?.id === option.id
                    ? "bg-red-600 hover:bg-red-700 border-red-600 text-white scale-105 shadow-lg shadow-red-600/25"
                    : "bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/70 hover:border-gray-500 hover:text-white hover:scale-102"
                  }
                  backdrop-blur-sm rounded-lg group overflow-hidden
                `}
                onClick={() => handleStreamingChange(option)}
              >
                {/* Background gradient effect */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${selectedStreaming?.id === option.id 
                    ? "bg-gradient-to-br from-red-500/20 to-red-700/20" 
                    : "bg-gradient-to-br from-gray-600/20 to-gray-800/20"
                  }
                `} />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="font-semibold text-sm mb-1">{option.name}</div>
                  {selectedStreaming?.id === option.id && (
                    <div className="text-xs text-red-200 font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Selected
                    </div>
                  )}
                  {selectedStreaming?.id !== option.id && (
                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      Click to select
                    </div>
                  )}
                </div>

                {/* Selection indicator */}
                {selectedStreaming?.id === option.id && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full shadow-lg" />
                )}
              </Button>
            ))}
          </div>
          
          {/* {selectedStreaming && (
            <div className="flex gap-4">
              {!isUpcoming() ? (
                <Button
                  onClick={handlePlay}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play Now
                </Button>
              ) : (
                <div className="bg-purple-600 text-white px-8 py-3 text-lg font-semibold rounded-md flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-sm">📅</span>
                  </div>
                  Coming Soon - {new Date(movie.releaseDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )} */}
        </div>

        {/* Movie Details Section */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Poster and Basic Info */}
            <div className="lg:col-span-1">
              <div className="relative group">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                  alt={movie.title}
                  className="w-full max-w-sm mx-auto rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
        
            </div>

            {/* Right Column - Detailed Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Section */}
              <div>
                <h3 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  About {movie.title}
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full" />
              </div>
              
              {/* Genres */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">Genres</h4>
                <div className="flex flex-wrap gap-3">
                  {movie.genres.map((genre, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600 hover:border-gray-500 transition-all duration-200 px-4 py-2 text-sm font-medium rounded-full"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                  Synopsis
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-600 to-transparent" />
                </h4>
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <p className="text-gray-300 leading-relaxed text-lg font-light">
                    {movie.overview}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                  Technical Details
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-600 to-transparent" />
                </h4>
                
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Original Title</span>
                          <span className="text-white font-semibold">{movie.originalTitle}</span>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Vote Count</span>
                          <span className="text-white font-semibold">{movie.voteCount.toLocaleString()} votes</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Popularity Score</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{movie.popularity.toFixed(0)}</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((movie.popularity / 1000) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* <div className="flex flex-col space-y-1">
                          <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Content Rating</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{movie.adult ? 'Adult' : 'General Audience'}</span>
                            <Badge 
                              variant={movie.adult ? "destructive" : "secondary"}
                              className={`text-xs ${
                                movie.adult 
                                  ? "bg-red-600/20 text-red-400 border-red-600/50" 
                                  : "bg-green-600/20 text-green-400 border-green-600/50"
                              }`}
                            >
                              {movie.adult ? '18+' : 'PG'}
                            </Badge>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Cast & Crew Section */}
        {(cast.length > 0 || crew.length > 0) && (
          <div className="container mx-auto px-6 py-8 space-y-12">
            {/* Section Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <Users className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Cast & Crew</h2>
            </div>

            {/* Crew */}
            {crew.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Film className="h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Crew</h3>
                  <div className="flex-1 h-px bg-gray-800"></div>
                  <span className="text-gray-500 text-sm uppercase tracking-wide">{crew.length} Members</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {crew.map((person) => (
                    <div 
                      key={person.id} 
                      onClick={() => navigate(`/cast/${person.id}`)}
                      className="group relative bg-black border border-gray-800 hover:border-blue-600 rounded-none overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-950 relative">
                        {person.profilePath ? (
                          <>
                            <img
                              src={`https://image.tmdb.org/t/p/w300${person.profilePath}`}
                              alt={person.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-5xl font-black group-hover:text-blue-600 transition-colors duration-300">
                            {person.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-900">
                        <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wide truncate group-hover:text-blue-600 transition-colors">{person.name}</h4>
                        <p className="text-gray-600 text-xs uppercase tracking-wide truncate">{person.job}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-red-600" />
                  <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Cast</h3>
                  <div className="flex-1 h-px bg-gray-800"></div>
                  <span className="text-gray-500 text-sm uppercase tracking-wide">{cast.length} Actors</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(expandedCast ? cast : cast.slice(0, 12)).map((actor) => (
                    <div 
                      key={actor.id} 
                      onClick={() => navigate(`/cast/${actor.id}`)}
                      className="group relative bg-black border border-gray-800 hover:border-red-600 rounded-none overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-950 relative">
                        {actor.profilePath ? (
                          <>
                            <img
                              src={`https://image.tmdb.org/t/p/w300${actor.profilePath}`}
                              alt={actor.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {actor.order === 0 && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase tracking-wide">
                                Lead
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-5xl font-black group-hover:text-red-600 transition-colors duration-300">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-900">
                        <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wide truncate group-hover:text-red-600 transition-colors">{actor.name}</h4>
                        <p className="text-gray-600 text-xs uppercase tracking-wide truncate">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {cast.length > 12 && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => setExpandedCast(!expandedCast)}
                      className="bg-black border border-gray-800 hover:border-red-600 text-white px-8 py-3 rounded-none uppercase tracking-wide font-bold transition-all"
                    >
                      {expandedCast ? (
                        <>
                          <ChevronUp className="h-5 w-5 mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-5 w-5 mr-2" />
                          View All Cast ({cast.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {castLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                <p className="text-gray-500 mt-4 uppercase tracking-wide">Loading Cast & Crew...</p>
              </div>
            )}
          </div>
        )}

        {/* Trailers & Videos Section */}
        {(videos.trailers?.length > 0 || videos.teasers?.length > 0 || videos.clips?.length > 0) && (
          <div className="container mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <Video className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Trailers & Videos</h2>
              <div className="flex-1 h-px bg-gray-800"></div>
            </div>

            {videosLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                <p className="text-gray-500 mt-4 uppercase tracking-wide">Loading Videos...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Trailers */}
                {videos.trailers?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Trailers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.trailers.slice(0, 4).map((trailer: Video) => (
                        <div
                          key={trailer.id}
                          onClick={() => setSelectedVideo(trailer)}
                          className="group cursor-pointer bg-black border border-gray-800 hover:border-red-600 rounded-none overflow-hidden transition-all"
                        >
                          <div className="aspect-video w-full relative">
                            <img
                              src={`https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`}
                              alt={trailer.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="bg-black/80 border border-white rounded-none p-4 group-hover:scale-110 transition-transform">
                                <Play className="h-12 w-12 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border-t border-gray-900">
                            <h4 className="font-bold text-white uppercase tracking-wide">{trailer.name}</h4>
                            {trailer.official && (
                              <Badge className="bg-green-600 text-white mt-2 uppercase tracking-wide rounded-none">
                                Official
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clips */}
                {videos.clips?.length > 0 && videos.trailers?.length === 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Clips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.clips.slice(0, 4).map((clip: Video) => (
                        <div
                          key={clip.id}
                          onClick={() => setSelectedVideo(clip)}
                          className="group cursor-pointer bg-black border border-gray-800 hover:border-red-600 rounded-none overflow-hidden transition-all"
                        >
                          <div className="aspect-video w-full relative">
                            <img
                              src={`https://img.youtube.com/vi/${clip.key}/maxresdefault.jpg`}
                              alt={clip.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="bg-black/80 border border-white rounded-none p-4 group-hover:scale-110 transition-transform">
                                <Play className="h-12 w-12 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border-t border-gray-900">
                            <h4 className="font-bold text-white uppercase tracking-wide">{clip.name}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Images Gallery Section */}
        {(images.backdrops?.length > 0 || images.posters?.length > 0) && (
          <div className="container mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <Images className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Images</h2>
              <div className="flex-1 h-px bg-gray-800"></div>
            </div>

            {imagesLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                <p className="text-gray-500 mt-4 uppercase tracking-wide">Loading Images...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Backdrops */}
                {images.backdrops?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Backdrops</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.backdrops.slice(0, 6).map((image: Image, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedImage(image)}
                          className="group cursor-pointer bg-black border border-gray-800 hover:border-red-600 rounded-none overflow-hidden transition-all aspect-video"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w780${image.filePath}`}
                            alt="Backdrop"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Similar Movies Section */}
        {similarMovies.length > 0 && (
          <div className="container mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <TrendingUp className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Similar Movies</h2>
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="text-gray-500 text-sm uppercase tracking-wide">{similarMovies.length} Movies</span>
            </div>

            {similarLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                <p className="text-gray-500 mt-4 uppercase tracking-wide">Loading Similar Movies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {similarMovies.map((similarMovie) => (
                  <div
                    key={similarMovie._id}
                    onClick={() => navigate(`/movie/${similarMovie._id}`)}
                    className="group cursor-pointer bg-black border border-gray-800 hover:border-red-600 rounded-none overflow-hidden transition-all duration-300 hover:scale-105"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-gray-950 relative">
                      {similarMovie.posterPath ? (
                        <>
                          <img
                            src={`https://image.tmdb.org/t/p/w300${similarMovie.posterPath}`}
                            alt={similarMovie.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl font-black group-hover:text-red-600 transition-colors">
                          {similarMovie.title.charAt(0)}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-white text-xs font-bold">{similarMovie.voteAverage.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-900">
                      <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wide truncate group-hover:text-red-600 transition-colors">{similarMovie.title}</h4>
                      <p className="text-gray-600 text-xs uppercase tracking-wide">{new Date(similarMovie.releaseDate).getFullYear()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {reviewStats && reviewStats.totalReviews > 0 && (
          <div className="container mx-auto px-6 py-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <MessageSquare className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">User Reviews</h2>
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="text-gray-500 text-sm uppercase tracking-wide">{reviewStats.totalReviews} Reviews</span>
            </div>

            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                <p className="text-gray-500 mt-4 uppercase tracking-wide">Loading Reviews...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review._id} className="bg-black border border-gray-800 rounded-none">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-white uppercase tracking-wide">{review.user.username}</h4>
                            <Badge className="bg-yellow-600 text-black font-bold text-xs uppercase">
                              <Star className="h-3 w-3 fill-current mr-1" />
                              {review.rating}/5
                            </Badge>
                          </div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            {new Date(review.addedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">{review.review}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movie Player Modal */}
      {showPlayer && movie && (
        <MoviePlayer
          movie={movie as any}
          onClose={handleClosePlayer}
          onWatchComplete={handleWatchComplete}
        />
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white uppercase tracking-wide">{selectedVideo.name}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-white hover:text-red-600 text-2xl font-bold uppercase tracking-wide"
              >
                ✕ Close
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                title={selectedVideo.name}
                src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1`}
                className="w-full h-full border border-gray-800"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end items-center mb-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white hover:text-red-600 text-2xl font-bold uppercase tracking-wide"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={`https://image.tmdb.org/t/p/original${selectedImage.filePath}`}
              alt="Full size image"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
