'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Metadata } from 'next';
import MoviePlayer from '../../../components/MoviePlayer';
import streamingService, { StreamingOption } from '../../../services/streamingService';

// Use environment variables, with fallback for production
const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://movie-7zq4.onrender.com')
  : 'https://movie-7zq4.onrender.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pagerender.netlify.app';

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

export default function MovieDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStreaming, setSelectedStreaming] = useState<StreamingOption | null>(null);
  const [streamingOptions, setStreamingOptions] = useState<StreamingOption[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const fetchMovie = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching movie with ID:', id);
      console.log('API URL:', API_URL);
      const url = `${API_URL}/api/movies/${id}`;
      console.log('Full URL:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      if (!response.ok) {
        console.error('Response not OK:', response.statusText);
        throw new Error('Movie not found');
      }
      const movieData = await response.json();
      console.log('Movie data received:', movieData);
      setMovie(movieData);
      setError(null);
      
      // Generate all streaming options
      const options: StreamingOption[] = streamingService.generateMovieStreamingOptionsSync(movieData);
      
      setStreamingOptions(options);
      if (options.length > 0) {
        setSelectedStreaming(options[0]);
      }
    } catch (error: any) {
      console.error('Error fetching movie:', error);
      setError(error.message || 'Failed to load movie');
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
    if (isUpcoming()) return;
    setShowPlayer(true);
  }, [isUpcoming]);

  const handleWatchComplete = useCallback((watchedMovie: any) => {
    console.log('Watch complete:', watchedMovie);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false);
  }, []);

  // Update document head with meta tags
  useEffect(() => {
    if (movie) {
      // Update title
      document.title = `${movie.title} (${new Date(movie.releaseDate).getFullYear()}) | MovieStream`;
      
      // Update or create meta tags
      const updateMetaTag = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        element.content = content;
      };

      const description = movie.overview || `Watch ${movie.title} - A ${movie.genres.map(g => g.name).join(', ')} movie`;
      const image = movie.backdropPath 
        ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
        : movie.posterPath 
        ? `https://image.tmdb.org/t/p/w780${movie.posterPath}`
        : `${SITE_URL}/placeholder-movie.jpg`;

      updateMetaTag('og:title', `${movie.title} (${new Date(movie.releaseDate).getFullYear()})`);
      updateMetaTag('og:description', description.substring(0, 160));
      updateMetaTag('og:image', image);
      updateMetaTag('og:type', 'video.movie');
      updateMetaTag('og:url', `${SITE_URL}/movie/${id}`);

      // Update description meta
      let descElement = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!descElement) {
        descElement = document.createElement('meta');
        descElement.setAttribute('name', 'description');
        document.head.appendChild(descElement);
      }
      descElement.content = description.substring(0, 160);
    }
  }, [movie, id, SITE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <div className="text-white text-sm">Movie ID: {id}</div>
          <div className="text-white text-sm">API URL: {API_URL}/api/movies/{id}</div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl">Movie not found</div>
          <div className="text-white text-sm mt-2">Movie ID: {id}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Netflix-style Hero Section */}
      <div 
        className="relative h-screen bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1920${movie.backdropPath})` }}
      >
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
                  <span className="text-lg font-semibold">⭐ {movie.voteAverage.toFixed(1)}</span>
                </div>
                <div className="text-lg">
                  {new Date(movie.releaseDate).getFullYear()}
                </div>
                {movie.runtime && (
                  <div className="text-lg">
                    {movie.runtime} min
                  </div>
                )}
                <div className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded">
                  HD
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.slice(0, 3).map((genre, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-800/80 text-white rounded">
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Overview */}
              <p className="text-white text-lg leading-relaxed mb-8 max-w-xl">
                {movie.overview}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                {!isUpcoming() ? (
                  <button
                    onClick={handlePlay}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded flex items-center gap-2"
                  >
                    <span>▶</span>
                    Play
                  </button>
                ) : (
                  <div className="bg-purple-600 text-white px-8 py-3 text-lg font-semibold rounded-md flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-sm">📅</span>
                    </span>
                    Coming Soon - {new Date(movie.releaseDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Options Section */}
      <div className="bg-black">
        <div className="container mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to Watch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {streamingOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleStreamingChange(option)}
                className={`
                  relative h-20 p-4 transition-all duration-300 ease-out rounded-lg
                  ${selectedStreaming?.id === option.id
                    ? "bg-red-600 hover:bg-red-700 text-white scale-105 shadow-lg"
                    : "bg-gray-800/50 border border-gray-600 text-gray-300 hover:bg-gray-700/70"
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="font-semibold text-sm mb-1">{option.name}</div>
                  {selectedStreaming?.id === option.id && (
                    <div className="text-xs text-red-200 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Selected
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Movie Details Section */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                alt={movie.title}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>

            {/* Details */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  About {movie.title}
                </h3>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Genres</h4>
                <div className="flex flex-wrap gap-3">
                  {movie.genres.map((genre, index) => (
                    <span key={index} className="px-4 py-2 bg-gray-800 text-white rounded-full">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-4">Synopsis</h4>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {movie.overview}
                </p>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-white mb-4">Technical Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-1">
                    <span className="text-gray-400 text-sm font-medium uppercase">Original Title</span>
                    <span className="text-white font-semibold">{movie.originalTitle}</span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-gray-400 text-sm font-medium uppercase">Vote Count</span>
                    <span className="text-white font-semibold">{movie.voteCount.toLocaleString()} votes</span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <span className="text-gray-400 text-sm font-medium uppercase">Popularity Score</span>
                    <span className="text-white font-semibold">{movie.popularity.toFixed(0)}</span>
                  </div>
                </div>
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
}