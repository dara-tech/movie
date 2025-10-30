import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Heart, Play, Star, Clock, CheckCircle } from 'lucide-react';

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

interface TvShow {
  _id: string;
  name: string;
  posterPath?: string;
  firstAirDate: string;
  voteAverage: number;
  genres: Array<{ name: string }>;
  overview?: string;
  streamingUrl?: string;
}

interface WatchlistItem {
  _id: string;
  movie?: Movie;
  tvShow?: TvShow;
  type: 'movie' | 'tvshow';
  status: 'plan_to_watch' | 'watching' | 'completed' | 'dropped';
  rating?: number;
  review?: string;
  addedAt: string;
  watchedAt?: string;
}

const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/api/watchlist', { params });
      setWatchlist(response.data.watchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayItem = (item: WatchlistItem) => {
    if (item.type === 'movie' && item.movie) {
      navigate(`/movie/${item.movie._id}`);
    } else if (item.type === 'tvshow' && item.tvShow) {
      navigate(`/tvshow/${item.tvShow._id}`);
    }
  };

  const handleRemoveFromWatchlist = async (item: WatchlistItem) => {
    try {
      if (item.type === 'movie' && item.movie) {
        await api.delete(`/api/movies/${item.movie._id}/watchlist`);
      } else if (item.type === 'tvshow' && item.tvShow) {
        await api.delete(`/api/watchlist/tvshows/${item.tvShow._id}`);
      }
      fetchWatchlist();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

 

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'plan_to_watch':
        return 'bg-blue-600';
      case 'watching':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-green-600';
      case 'dropped':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'plan_to_watch':
        return <Clock className="h-4 w-4" />;
      case 'watching':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'dropped':
        return <Heart className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className=" p-6 space-y-8">
        {/* Enhanced Header - Mobile Responsive */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                My Watchlist
              </h1>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg mt-1 sm:mt-2">Your personal movie and TV show collection</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-center sm:text-right">
                <p className="text-xs sm:text-sm text-gray-400">Total Items</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{watchlist.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/30 hover:border-blue-600/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-blue-300 font-medium">Plan to Watch</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">
                    {watchlist.filter(item => item.status === 'plan_to_watch').length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-600/20 rounded-full">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-700/30 hover:border-yellow-600/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-yellow-300 font-medium">Watching</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">
                    {watchlist.filter(item => item.status === 'watching').length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-600/20 rounded-full">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/30 hover:border-green-600/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-300 font-medium">Completed</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">
                    {watchlist.filter(item => item.status === 'completed').length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-600/20 rounded-full">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-700/30 hover:border-red-600/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-red-300 font-medium">Total</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">{watchlist.length}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-600/20 rounded-full">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filter - Mobile Responsive */}
        <Card className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600/30 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-white font-semibold text-sm sm:text-base md:text-lg">Filter by status:</span>
                <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-56 bg-gray-700/80 border-gray-600/50 text-white hover:bg-gray-600/80 transition-colors duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Items</SelectItem>
                    <SelectItem value="plan_to_watch" className="text-white hover:bg-gray-700 focus:bg-gray-700">Plan to Watch</SelectItem>
                    <SelectItem value="watching" className="text-white hover:bg-gray-700 focus:bg-gray-700">Currently Watching</SelectItem>
                    <SelectItem value="completed" className="text-white hover:bg-gray-700 focus:bg-gray-700">Completed</SelectItem>
                    <SelectItem value="dropped" className="text-white hover:bg-gray-700 focus:bg-gray-700">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-right">
                Showing {watchlist.filter(item => statusFilter === 'all' || item.status === statusFilter).length} items
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Watchlist Items - Mobile Responsive */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {statusFilter === 'all' ? 'All Items' : `${statusFilter.replace('_', ' ')} Items`}
            </h2>
            <div className="text-xs sm:text-sm text-gray-400">
              {watchlist.filter(item => statusFilter === 'all' || item.status === statusFilter).length} items
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-800 to-gray-700 animate-pulse rounded-lg sm:rounded-xl h-64 sm:h-72 md:h-80 shadow-lg"
                />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <div className="relative">
                <Heart className="h-16 w-16 sm:h-20 sm:w-20 text-gray-600 mx-auto mb-4 sm:mb-6 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-xl" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2 sm:mb-3">No items in your watchlist</h3>
              <p className="text-gray-500 text-sm sm:text-base md:text-lg">Start adding movies and TV shows to build your collection</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {watchlist.filter(item => item && (item.movie || item.tvShow)).map((item) => {
                const content = item.movie || item.tvShow;
                const isMovie = item.type === 'movie';
                
                return (
                <div key={item._id} className="relative group cursor-pointer">
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg sm:rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700/50 hover:border-red-500/50 group-hover:ring-2 group-hover:ring-red-500/30">
                    <div className="relative overflow-hidden h-64 sm:h-72 md:h-80">
                      <img
                        src={content?.posterPath ? `https://image.tmdb.org/t/p/w500${content.posterPath}` : '/placeholder-movie.jpg'}
                        alt={isMovie ? item.movie?.title : item.tvShow?.name}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-movie.jpg';
                        }}
                      />
                      
                      {/* Gradient overlay for better readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/0" />
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 transform transition-all duration-300 group-hover:scale-110">
                        <Badge className={`${isMovie ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'} text-white px-2 py-1 font-bold shadow-xl backdrop-blur-sm border border-white/20 text-xs hover:shadow-2xl`}>
                          {isMovie ? ' Movie' : ' Series'}
                        </Badge>
                      </div>
                      
                      {/* Enhanced Status Badge - Mobile Responsive */}
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10 transform transition-all duration-300 group-hover:scale-110">
                        <Badge className={`${getStatusColor(item.status)} text-white px-2 py-1 font-bold shadow-xl backdrop-blur-md border border-white/20 text-xs hover:shadow-2xl`} title={item.status.replace('_', ' ')}>
                          {getStatusIcon(item.status)}
                        </Badge>
                      </div>

                      {/* Enhanced Rating - Mobile Responsive */}
                      {item.rating && (
                        <div className="absolute bottom-16 sm:bottom-20 right-2 sm:right-3 z-10 transform transition-all duration-300 group-hover:scale-110">
                          <Badge className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 text-black px-2 sm:px-3 py-1 sm:py-1.5 font-bold shadow-xl border border-yellow-300/30 text-xs hover:shadow-2xl">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {item.rating}/5
                          </Badge>
                        </div>
                      )}

                      {/* Title overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="font-bold text-white text-sm sm:text-base mb-2 line-clamp-2 leading-tight drop-shadow-lg">
                          {isMovie ? item.movie?.title : item.tvShow?.name}
                        </h3>
                        
                        <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                          <span className="font-medium drop-shadow">
                            {isMovie 
                              ? new Date(item.movie?.releaseDate || '').getFullYear()
                              : new Date(item.tvShow?.firstAirDate || '').getFullYear()
                            }
                          </span>
                          {isMovie && item.movie?.runtime && (
                            <span className="font-medium hidden sm:inline drop-shadow">{Math.floor(item.movie.runtime / 60)}h {item.movie.runtime % 60}m</span>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Overlay Actions - Mobile Responsive */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="flex gap-2 sm:gap-3">
                          <Button
                            size="sm"
                            onClick={() => handlePlayItem(item)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-red-400/30 hover:border-red-300/50 rounded-full"
                          >
                            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromWatchlist(item)}
                            className="bg-black/70 border-white/30 text-white hover:bg-white hover:text-black font-bold p-2 sm:p-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg rounded-full"
                          >
                            <span className="text-lg">×</span>
                          </Button>
                        </div>
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

export default WatchlistPage;
