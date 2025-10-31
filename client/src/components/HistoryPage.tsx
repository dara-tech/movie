/* eslint-disable react/no-unknown-property, @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
// import MovieGrid from './MovieGrid';
import { Button } from './ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Play, Clock, CheckCircle, RotateCcw, Search, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
}

interface WatchHistoryItem {
  _id: string;
  movie?: Movie;
  tvShow?: TvShow;
  watchedAt: string;
  duration: number;
  completed: boolean;
  lastPosition: number;
  season?: number;
  episode?: number;
}

interface TvShow {
  _id: string;
  name: string;
  posterPath?: string;
  firstAirDate: string;
  voteAverage: number;
  genres: Array<{ name: string }>;
}

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('watchedAt');
  // const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchContinueWatching();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/history');
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContinueWatching = async () => {
    try {
      const response = await api.get('/api/history/continue');
      setContinueWatching(response.data);
    } catch (error) {
      console.error('Error fetching continue watching:', error);
    }
  };

  const handlePlayMovie = (movie: Movie) => {
    // setSelectedMovie(movie);
    console.log('Play movie:', movie.title);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Helper to calculate progress width
  const getProgressWidth = (item: WatchHistoryItem) => {
    const isMovie = !!item.movie;
    const totalDuration = isMovie ? (item.movie?.runtime || 120) * 60 : 3600;
    return (item.lastPosition / totalDuration) * 100;
  };

  // Filter and sort history
  const filteredHistory = React.useMemo(() => {
    let filtered = [...history];

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const content = item.movie || item.tvShow;
        const title = item.movie?.title || item.tvShow?.name || '';
        return title.toLowerCase().includes(search);
      });
    }

    // Filter by content type
    if (contentTypeFilter !== 'all') {
      if (contentTypeFilter === 'movies') {
        filtered = filtered.filter(item => item.movie);
      } else if (contentTypeFilter === 'tvshows') {
        filtered = filtered.filter(item => item.tvShow);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'watchedAt':
          return new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
        case 'duration':
          return b.duration - a.duration;
        case 'title':
          const aTitle = (a.movie?.title || a.tvShow?.name || '').toLowerCase();
          const bTitle = (b.movie?.title || b.tvShow?.name || '').toLowerCase();
          return aTitle.localeCompare(bTitle);
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, searchTerm, contentTypeFilter, sortBy]);

  // const movies = history.map(item => item.movie);
  // const continueMovies = continueWatching.map(item => item.movie);

  return (
    <div className="min-h-screen bg-black  ">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">Watch History</h1>
          <p className="text-gray-400">Your movie watching journey</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-none"
              />
            </div>

            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white rounded-none">
                <SelectValue placeholder="All Content" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="movies">Movies Only</SelectItem>
                <SelectItem value="tvshows">TV Shows Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white rounded-none">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="watchedAt">Recently Watched</SelectItem>
                <SelectItem value="duration">Watch Duration</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Continue Watching</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {continueWatching.map((item) => {
                const content = item.movie || item.tvShow;
                const isMovie = !!item.movie;
                
                return (
                  <div key={item._id} className="relative group">
                    <div className="bg-gray-800 rounded-none overflow-hidden border border-gray-700/50">
                      <div className="relative">
                        <img
                          src={content?.posterPath ? `https://image.tmdb.org/t/p/w500${content.posterPath}` : '/placeholder-movie.jpg'}
                          alt={isMovie ? item.movie?.title : item.tvShow?.name}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-movie.jpg';
                          }}
                        />
                        
                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 p-2">
                          <div className="w-full bg-gray-600 rounded-none h-1">
                            <div 
                              className="bg-red-600 h-1 rounded-none transition-all duration-300"
                              style={{ width: `${getProgressWidth(item)}%` } as React.CSSProperties}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">
                            {Math.floor(item.lastPosition / 60)}m remaining
                          </p>
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              onClick={() => handlePlayMovie(content as Movie)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                          {isMovie ? item.movie?.title : item.tvShow?.name}
                        </h3>
                        {!isMovie && item.season && item.episode && (
                          <p className="text-xs text-blue-400 mb-1">
                            S{item.season}E{item.episode}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatDate(item.watchedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Watched */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Recently Watched</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-800 animate-pulse rounded-none border border-gray-700/50 h-80"
                />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No watch history</h3>
              <p className="text-gray-500">Start watching movies to see your history here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredHistory.map((item) => {
                const content = item.movie || item.tvShow;
                const isMovie = !!item.movie;
                
                return (
                  <div key={item._id} className="relative group">
                    <div className="bg-gray-800 rounded-none overflow-hidden border border-gray-700/50">
                      <div className="relative">
                        <img
                          src={content?.posterPath ? `https://image.tmdb.org/t/p/w500${content.posterPath}` : '/placeholder-movie.jpg'}
                          alt={isMovie ? item.movie?.title : item.tvShow?.name}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-movie.jpg';
                          }}
                        />
                        
                        {/* Completion Badge */}
                        {item.completed && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        )}

                        {/* Duration Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-gray-900 bg-opacity-75 text-white">
                            {formatDuration(item.duration)}
                          </Badge>
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              onClick={() => handlePlayMovie(content as unknown as Movie)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {item.completed ? 'Rewatch' : 'Continue'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                          {isMovie ? item.movie?.title : item.tvShow?.name}
                        </h3>
                        
                        {!isMovie && item.season && item.episode && (
                          <p className="text-xs text-blue-400 mb-1">
                            S{item.season}E{item.episode}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>{isMovie ? new Date(item.movie?.releaseDate || '').getFullYear() : new Date(item.tvShow?.firstAirDate || '').getFullYear()}</span>
                          <span>{formatDate(item.watchedAt)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-300">
                              {content?.voteAverage?.toFixed(1)} ⭐
                            </span>
                          </div>
                          
                          {isMovie && item.movie?.runtime && (
                            <span className="text-xs text-gray-400">
                              {Math.floor(item.movie.runtime / 60)}h {item.movie.runtime % 60}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
