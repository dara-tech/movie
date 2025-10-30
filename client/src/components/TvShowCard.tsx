import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Play, Plus, Star, Heart, Check, TrendingUp } from 'lucide-react';

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

interface TVShowCardProps {
  tvShow: TVShow;
  onPlay?: (tvShow: TVShow) => void;
  onAddToWatchlist?: (tvShow: TVShow) => void;
  onRemoveFromWatchlist?: (tvShow: TVShow) => void;
  isInWatchlist?: boolean;
}

const TVShowCard: React.FC<TVShowCardProps> = ({
  tvShow,
  onPlay,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<'idle' | 'adding' | 'success' | 'error'>('idle');


  const getMatchPercentage = () => {
    return Math.floor((tvShow.voteAverage / 10) * 100);
  };

  const isUpcoming = () => {
    const firstAirDate = new Date(tvShow.firstAirDate);
    const currentDate = new Date();
    return firstAirDate > currentDate;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpcoming()) return;
    if (onPlay) {
      onPlay(tvShow);
    }
  };

  const handleDetailClick = () => {
    if (isUpcoming()) return;
    navigate(`/tvshow/${tvShow._id}`);
  };

  const handleAddToWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (watchlistStatus === 'idle') {
      setWatchlistStatus('adding');
      
      try {
        if (isInWatchlist && onRemoveFromWatchlist) {
          await onRemoveFromWatchlist(tvShow);
          setWatchlistStatus('success');
        } else if (!isInWatchlist && onAddToWatchlist) {
          await onAddToWatchlist(tvShow);
          setWatchlistStatus('success');
        }
        
        setTimeout(() => {
          setWatchlistStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Error with watchlist action:', error);
        setWatchlistStatus('error');
        
        setTimeout(() => {
          setWatchlistStatus('idle');
        }, 3000);
      }
    }
  };

  const posterUrl = tvShow.posterPath 
    ? `https://image.tmdb.org/t/p/w500${tvShow.posterPath}` 
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iIzFmMjkzNyIvPgogIDxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzNzQxNTEiIHN0cm9rZT0iIzZiNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgeD0iMTUwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiI+Tm8gSW1hZ2U8L3RleHQ+CiAgPHRleHQgeD0iMTUwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+QXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';

  return (
    <div 
      className={`group relative w-full transition-all duration-300 ease-out ${
        isUpcoming() ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
      }`}
      onMouseEnter={() => !isUpcoming() && setIsHovered(true)}
      onMouseLeave={() => !isUpcoming() && setIsHovered(false)}
    >
      {/* Modern Card Container */}
      <Card className={`
        relative overflow-hidden bg-transparent border-none shadow-lg sm:shadow-2xl
        transition-all duration-300 ease-out
        ${isUpcoming() ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${isHovered && !isUpcoming() ? 'scale-102 sm:scale-105 z-50 shadow-lg sm:shadow-2xl shadow-blue-500/20' : 'scale-100'}
      `}>
        {/* Detail Clickable Area */}
        <div 
          className={`absolute inset-0 z-20 transition-colors duration-200 ${
            isUpcoming() ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/5'
          }`}
          onClick={handleDetailClick}
          title={isUpcoming() ? 'Coming Soon' : 'Click to view details'}
        />
        
        {/* Modern Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl">
          <img
            src={posterUrl}
            alt={tvShow.name}
            className={`
              w-full h-full object-cover transition-all duration-500
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              ${isHovered ? 'scale-105 brightness-110' : 'scale-100'}
            `}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = '/placeholder-movie.jpg';
              setImageLoaded(true);
            }}
          />
          
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            </div>
          )}

          {/* Modern gradient overlay with title space */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Trending Badge */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-30">
            <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-sm border border-blue-500/50 shadow-lg rounded-full">
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
              <span className="hidden sm:inline">#1 Trending</span>
              <span className="sm:hidden">#1</span>
            </Badge>
          </div>

          {/* Heart Icon */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30">
            <Button
              onClick={handleAddToWatchlistClick}
              disabled={watchlistStatus === 'adding'}
              size="sm"
              variant="ghost"
              className={`rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 transition-all duration-300 ${
                watchlistStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : watchlistStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : isInWatchlist
                  ? 'bg-red-600/90 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20'
              }`}
            >
              {watchlistStatus === 'adding' ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent" />
              ) : watchlistStatus === 'success' ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : watchlistStatus === 'error' ? (
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 rotate-45" />
              ) : (
                <Heart className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 ${
                  isInWatchlist 
                    ? 'fill-red-500 text-red-500 scale-110' 
                    : 'text-gray-300 hover:text-red-400'
                }`} />
              )}
            </Button>
          </div>

          {/* Title Overlay at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-20">
            <h3 className="font-bold text-white text-lg sm:text-xl leading-tight mb-2 sm:mb-3 drop-shadow-2xl line-clamp-2">
              {tvShow.name}
            </h3>
            
            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
              {tvShow.genres.slice(0, 2).map((genre, index) => (
                <span
                  key={index}
                  className="text-gray-200 text-xs font-medium bg-black/50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Info Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Rating Badge */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/20">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                <span className="text-green-300 font-bold text-xs">
                  {getMatchPercentage()}%
                </span>
              </div>

              {/* Rating Badge */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/20">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-400 fill-current" />
                <span className="text-white text-xs font-bold">
                  {tvShow.voteAverage.toFixed(1)}
                </span>
              </div>

              {/* Duration Badge */}


              {/* {tvShow.averageRuntime && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <Clock className="h-3.5 w-3.5 text-gray-200" />
                  <span className="text-gray-100 text-xs font-medium">
                    {formatRuntime(tvShow.averageRuntime)}
                  </span>
                </div>
              )} */}
            </div>
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <Button
              onClick={handlePlayClick}
              size="lg"
              className="bg-white/90 hover:bg-white text-black rounded-full h-12 w-12 sm:h-16 sm:w-16 p-0 shadow-xl sm:shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-110 pointer-events-auto"
            >
              <Play className="h-4 w-4 sm:h-6 sm:w-6 ml-0.5 sm:ml-1" fill="currentColor" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(TVShowCard);