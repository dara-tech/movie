import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Play, 
  Plus, 
  Star, 
  Clock, 
  Users, 
  Tv,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import TvShowPlayer from './TvShowPlayer';
import { TVShowSEO } from './SEO';

interface TVShow {
  _id: string;
  name: string;
  originalName?: string;
  overview?: string;
  firstAirDate: string;
  lastAirDate?: string;
  status?: string;
  type?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  averageRuntime?: number;
  posterPath?: string;
  backdropPath?: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genres: Array<{ name: string }>;
  networks: Array<{
    id: number;
    name: string;
    logoPath?: string;
    originCountry: string;
  }>;
  productionCompanies: Array<{
    id: number;
    name: string;
    logoPath?: string;
    originCountry: string;
  }>;
  createdBy: Array<{
    id: number;
    name: string;
    profilePath?: string;
  }>;
  seasons: Array<{
    airDate?: Date | string;
    episodeCount: number;
    id: number;
    name: string;
    overview: string;
    posterPath: string;
    seasonNumber: number;
    voteAverage: number;
  }>;
  streamingUrl?: string;
  vidsrcUrl?: string;
  imdbId?: string;
  tmdbId?: number;
}

const TVShowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tvShow, setTvShow] = useState<TVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [availableEpisodes, setAvailableEpisodes] = useState<number[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const fetchTVShow = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tvshows/${id}`);
      setTvShow(response.data);
    } catch (error: any) {
      console.error('Error fetching TV show:', error);
      setError('TV show not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!tvShow) return;
    
    setIsAddingToWatchlist(true);
    try {
      await api.post(`/api/watchlist/tvshows/${tvShow._id}`);
      setIsInWatchlist(true);
      console.log(`Added "${tvShow.name}" to watchlist`);
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      if (error.response?.status === 400) {
        alert('This TV show is already in your watchlist!');
      } else {
        alert('Failed to add TV show to watchlist. Please try again.');
      }
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handlePlay = () => {
    // Show the TvShowPlayer
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const handleWatchComplete = (tvShow: any, season: number, episode: number) => {
    console.log('Watch complete:', tvShow, 'Season:', season, 'Episode:', episode);
    // You can add logic here to update watch history, etc.
  };

  const updateAvailableEpisodes = (seasonNumber: number) => {
    if (tvShow?.seasons) {
      const season = tvShow.seasons.find(s => s.seasonNumber === seasonNumber);
      if (season) {
        const episodes = Array.from({ length: season.episodeCount || 0 }, (_, i) => i + 1);
        setAvailableEpisodes(episodes);
        setSelectedEpisode(1); // Reset to first episode
      }
    }
  };

  const handleSeasonChange = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    updateAvailableEpisodes(seasonNumber);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Returning Series':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'Ended':
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
      case 'In Production':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'Canceled':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  useEffect(() => {
    if (id) {
      fetchTVShow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tvShow?.seasons && tvShow.seasons.length > 0) {
      // Set selectedSeason to the first available season
      const firstSeason = tvShow.seasons[0];
      if (firstSeason && firstSeason.seasonNumber !== selectedSeason) {
        setSelectedSeason(firstSeason.seasonNumber);
        // Update episodes with the first season's number
        updateAvailableEpisodes(firstSeason.seasonNumber);
      } else {
        updateAvailableEpisodes(selectedSeason);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvShow]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">TV Show Not Found</h1>
          <Button onClick={() => navigate('/tvshows')} className="bg-red-600 hover:bg-red-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to TV Shows
          </Button>
        </div>
      </div>
    );
  }

  const backdropUrl = tvShow.backdropPath 
    ? `https://image.tmdb.org/t/p/w1280${tvShow.backdropPath}` 
    : '/placeholder-movie.jpg';

  // Get season-specific CSS filters for visual distinction
  const getSeasonFilters = () => {
    if (selectedSeason > 0) {
      const filters = [
        'brightness-110 contrast-110 saturate-110', // Season 1
        'brightness-90 contrast-120 saturate-90',   // Season 2
        'brightness-110 contrast-100 saturate-120', // Season 3
        'brightness-95 contrast-110 saturate-95',   // Season 4
        'brightness-105 contrast-115 saturate-105', // Season 5
        'brightness-100 contrast-105 saturate-110', // Season 6
        'brightness-110 contrast-120 saturate-100', // Season 7
        'brightness-90 contrast-100 saturate-115',  // Season 8
      ];
      return filters[(selectedSeason - 1) % filters.length];
    }
    return 'brightness-100 contrast-100 saturate-100';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* SEO Meta Tags */}
      {tvShow && (
        <TVShowSEO 
          tvShow={{
            name: tvShow.name,
            overview: tvShow.overview,
            firstAirDate: tvShow.firstAirDate,
            lastAirDate: tvShow.lastAirDate,
            posterPath: tvShow.posterPath,
            backdropPath: tvShow.backdropPath,
            genres: tvShow.genres,
            voteAverage: tvShow.voteAverage,
            numberOfSeasons: tvShow.numberOfSeasons,
            numberOfEpisodes: tvShow.numberOfEpisodes,
            status: tvShow.status,
            type: tvShow.type,
            networks: tvShow.networks,
            createdBy: tvShow.createdBy,
            tmdbId: tvShow.tmdbId
          }}
        />
      )}
      
      {/* Elegant Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={backdropUrl}
          alt={tvShow.name}
          className={`w-full h-full object-cover transition-all duration-500 ${
            selectedSeason > 0 ? `scale-105 ${getSeasonFilters()}` : 'scale-100'
          }`}
          aria-label={`Backdrop image for ${tvShow.name}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Season Indicator */}
        {selectedSeason > 0 && (
          <div className="absolute top-6 right-6">
            <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <span className="text-white text-sm font-medium">
                Season {selectedSeason}
              </span>
            </div>
          </div>
        )}
        
        {/* Clean Back Button */}
        <div className="absolute top-6 left-6">
          <Button
            onClick={() => navigate('/tvshows')}
            variant="outline"
            className="bg-black/70 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        

          {/* Content */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white leading-tight">
                {tvShow.name}
              </h1>
              {tvShow.originalName && tvShow.originalName !== tvShow.name && (
                <p className="text-lg sm:text-xl text-gray-400 mb-4">{tvShow.originalName}</p>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold">{tvShow.voteAverage.toFixed(1)}</span>
                  <span className="text-xs sm:text-sm text-gray-400">({tvShow.voteCount})</span>
                </div>
                
                {tvShow.averageRuntime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{formatRuntime(tvShow.averageRuntime)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{tvShow.numberOfSeasons} Season{tvShow.numberOfSeasons !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{tvShow.numberOfEpisodes} Episode{tvShow.numberOfEpisodes !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Status and Type */}
              <div className="flex flex-wrap gap-2 mb-4">
                {tvShow.status && (
                  <Badge className={`px-2 py-1 text-xs sm:text-sm ${getStatusColor(tvShow.status)}`}>
                    {tvShow.status}
                  </Badge>
                )}
                {tvShow.type && (
                  <Badge variant="outline" className="px-2 py-1 text-xs sm:text-sm bg-blue-600/20 border-blue-600/30 text-blue-400">
                    {tvShow.type}
                  </Badge>
                )}
              </div>
            </div>

            {/* Season and Episode Selection */}
            {tvShow.seasons && tvShow.seasons.length > 0 && (
              <div className="bg-gray-900/50 rounded-lg p-4 sm:p-6 border border-gray-800">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-white">Select Season & Episode</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Season Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Season
                    </label>
                    <Select value={selectedSeason.toString()} onValueChange={(value) => handleSeasonChange(parseInt(value))}>
                      <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-red-600 h-10 sm:h-11">
                        <SelectValue placeholder="Select a season" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                        {tvShow.seasons.map((season) => (
                          <SelectItem 
                            key={season.seasonNumber} 
                            value={season.seasonNumber.toString()}
                            className="text-white hover:bg-gray-700 focus:bg-gray-700 text-sm sm:text-base"
                          >
                            <span className="truncate">Season {season.seasonNumber} ({season.episodeCount} episodes)</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Episode Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Episode
                    </label>
                    <Select value={selectedEpisode.toString()} onValueChange={(value) => setSelectedEpisode(parseInt(value))}>
                      <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-red-600 h-10 sm:h-11">
                        <SelectValue placeholder="Select an episode" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                        {availableEpisodes.length > 0 ? (
                          availableEpisodes.map((episode) => (
                            <SelectItem 
                              key={episode} 
                              value={episode.toString()}
                              className="text-white hover:bg-gray-700 focus:bg-gray-700 text-sm sm:text-base"
                            >
                              Episode {episode}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-gray-400 text-sm">No episodes available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selected Season Info */}
                {tvShow.seasons.find(s => s.seasonNumber === selectedSeason) && (
                  <div className="mt-4 p-3 sm:p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">
                      {tvShow.seasons.find(s => s.seasonNumber === selectedSeason)?.name}
                    </h4>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {tvShow.seasons.find(s => s.seasonNumber === selectedSeason)?.overview || 
                       `Season ${selectedSeason} of ${tvShow.name}`}
                    </p>
                    {(() => {
                      const season = tvShow.seasons.find(s => s.seasonNumber === selectedSeason);
                      if (!season?.airDate) return null;
                      return (
                        <p className="text-gray-400 text-xs mt-2">
                          First aired: {formatDate(
                            season.airDate instanceof Date 
                              ? season.airDate.toString()
                              : String(season.airDate)
                          )}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={handlePlay}
                className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold w-full sm:w-auto"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="truncate">
                  {selectedSeason > 1 || selectedEpisode > 1 
                    ? `Play S${selectedSeason}E${selectedEpisode.toString().padStart(2, '0')}` 
                    : 'Play Now'
                  }
                </span>
              </Button>
              
              <Button
                onClick={handleAddToWatchlist}
                disabled={isAddingToWatchlist}
                variant="outline"
                className={`px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold w-full sm:w-auto ${
                  isInWatchlist
                    ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                    : 'bg-transparent border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                {isAddingToWatchlist ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                )}
                <span className="truncate">
                  {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </span>
              </Button>
            </div>

            {/* Overview */}
            {tvShow.overview && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">Overview</h2>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed">{tvShow.overview}</p>
              </div>
            )}

            {/* Genres */}
            {tvShow.genres && tvShow.genres.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {tvShow.genres.map((genre, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="px-2 py-1 text-xs sm:text-sm bg-gray-800/50 border-gray-600 text-gray-300"
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Seasons */}
            {tvShow.seasons && tvShow.seasons.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">Seasons</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {tvShow.seasons.map((season, index) => (
                    <Card 
                      key={index} 
                      className={`bg-gray-900/50 border-gray-800 cursor-pointer transition-all duration-200 hover:bg-gray-800/70 hover:border-gray-600 hover:scale-105 ${
                        selectedSeason === season.seasonNumber 
                          ? 'ring-2 ring-red-500 bg-red-900/20 border-red-500' 
                          : ''
                      }`}
                      onClick={() => handleSeasonChange(season.seasonNumber)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <img
                            src={season.posterPath 
                              ? `https://image.tmdb.org/t/p/w154${season.posterPath}`
                              : tvShow.posterPath 
                                ? `https://image.tmdb.org/t/p/w154${tvShow.posterPath}`
                                : '/placeholder-movie.jpg'
                            }
                            alt={season.name}
                            className="w-16 h-24 sm:w-20 sm:h-32 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1 text-sm sm:text-base truncate">{season.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-400 mb-2">
                              {season.episodeCount} episodes
                            </p>
                            {season.airDate && (
                              <p className="text-xs sm:text-sm text-gray-400">
                                {formatDate(new Date(season.airDate).toLocaleDateString())}
                              </p>
                            )}
                            {season.voteAverage > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-400">{season.voteAverage.toFixed(1)}</span>
                              </div>
                            )}
                            {selectedSeason === season.seasonNumber && (
                              <div className="flex items-center gap-1 mt-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs text-red-400 font-medium">Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TV Show Player Modal */}
      {showPlayer && tvShow && (
        <TvShowPlayer
          tvShow={tvShow as any}
          season={selectedSeason}
          episode={selectedEpisode}
          onClose={handleClosePlayer}
          onWatchComplete={handleWatchComplete}
        />
      )}
    </div>
  );
};

export default TVShowDetailPage;
