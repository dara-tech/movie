import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Play, Star, Calendar, Clock } from 'lucide-react';
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


const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStreaming, setSelectedStreaming] = useState<StreamingOption | null>(null);
  const [streamingOptions, setStreamingOptions] = useState<StreamingOption[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchMovie();
    }
  }, [id, fetchMovie]);

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
      </div>

      {/* Movie Player Modal */}
      {showPlayer && movie && (
        <MoviePlayer
          movie={movie as any}
          onClose={handleClosePlayer}
          onWatchComplete={handleWatchComplete}
        />
      )}
    </div>
  );
};

export default MovieDetailPage;
