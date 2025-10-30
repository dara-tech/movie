import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, Clock, Info, CheckCircle } from 'lucide-react';

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

interface MovieCardProps {
  movie: Movie;
  onPlay?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  isInWatchlist?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPlay,
  onAddToWatchlist,
  isInWatchlist = false
}) => {
  const navigate = useNavigate();
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isUpcoming = useCallback(() => {
    const releaseDate = new Date(movie.releaseDate);
    const currentDate = new Date();
    return releaseDate > currentDate;
  }, [movie.releaseDate]);

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpcoming()) return; // Don't allow detail view for upcoming movies
    // Navigate to movie detail page within React app
    navigate(`/movie/${movie._id}`);
  };

  const handleAddToWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isAddingToWatchlist) return;
    
    setIsAddingToWatchlist(true);
    try {
      await onAddToWatchlist?.(movie);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  return (
    <div className="relative group cursor-pointer">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg sm:rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700/50 hover:border-red-500/50 group-hover:ring-2 group-hover:ring-red-500/30">
        <div className="relative overflow-hidden h-64 sm:h-72 md:h-80">
          <img
            src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.jpg'}
            alt={movie.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-movie.jpg';
            }}
          />
          
          {/* Gradient overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/0" />

          {/* Quality/Status badges - Left side */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-2">
            {movie.voteAverage >= 8 && !isUpcoming() && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm border border-yellow-400/50 shadow-lg">
                TOP RATED
              </Badge>
            )}
          </div>

          {/* Quality/Status badges - Right side */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1 sm:gap-2">
            {isUpcoming() ? (
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm border border-purple-500/50 shadow-lg">
                COMING SOON
              </Badge>
            ) : (
              <>
                {(movie.vidsrcUrl || movie.tmdbId || movie.imdbId) && (
                  <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm border border-red-500/50 shadow-lg">
                    HD
                  </Badge>
                )}
              </>
            )}
            
            {/* Watchlist indicator */}
            {isInWatchlist && (
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-full p-1.5 sm:p-2 shadow-lg border border-green-500/50">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            )}
          </div>

          {/* Rating badge */}

          {/* <div className="absolute bottom-12 sm:bottom-14 left-2 sm:left-3">
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-600/50">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
              <span className="text-white text-xs sm:text-sm font-bold">
                {movie.voteAverage.toFixed(1)}
              </span>
            </div>
          </div> */}

          {/* Title and year overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg line-clamp-2 mb-1 sm:mb-2 drop-shadow-lg">
              {movie.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs sm:text-sm font-medium">
                {formatDate(movie.releaseDate)}
              </span>
              {movie.runtime && (
                <div className="flex items-center gap-1 text-gray-300">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">{formatRuntime(movie.runtime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hover overlay with action buttons */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3">
              {!isUpcoming() && (
                <>
                  <Button
                    onClick={handleAddToWatchlistClick}
                    size="sm"
                    variant="outline"
                    disabled={isAddingToWatchlist}
                    className={`font-bold p-2 sm:p-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg rounded-full ${
                      isInWatchlist 
                        ? 'bg-green-600/90 border-green-500/50 text-white hover:bg-green-700' 
                        : isAddingToWatchlist
                          ? 'bg-gray-600/90 border-gray-500/50 text-gray-400 cursor-not-allowed'
                          : 'bg-black/70 border-white/30 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {isAddingToWatchlist ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isInWatchlist ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                  <Button
                    onClick={handleDetailClick}
                    size="sm"
                    variant="outline"
                    className="bg-black/70 border-white/30 text-white hover:bg-white hover:text-black font-bold p-2 sm:p-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg rounded-full"
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieCard);
