import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Tv, Calendar } from 'lucide-react';
import api from '../services/api';

interface TvShow {
  _id: string;
  name: string;
  overview?: string;
  firstAirDate: string;
  lastAirDate?: string;
  voteAverage: number;
  genres: Array<{ name: string }>;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  posterPath?: string;
  backdropPath?: string;
  status?: string;
  type?: string;
  vidsrcUrl?: string;
  tmdbId?: number;
  imdbId?: string;
}

interface Episode {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview?: string;
  airDate?: string;
  stillPath?: string;
  vidsrcUrl?: string;
}

interface TvShowPlayerProps {
  tvShow: TvShow;
  season: number;
  episode: number;
  onClose: () => void;
  onWatchComplete?: (tvShow: TvShow, season: number, episode: number) => void;
}

const TvShowPlayer: React.FC<TvShowPlayerProps> = ({
  tvShow,
  season,
  episode,
  onClose,
  onWatchComplete
}) => {
  const [videoError, setVideoError] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);

  // Track watch history for TV shows
  const trackWatchHistory = useCallback(async (completed: boolean = false) => {
    try {
      const watchData = {
        duration: 3600, // Default 1 hour for TV episodes
        completed,
        lastPosition: 0, // TV shows don't track position the same way
        season,
        episode
      };

      await api.post(`/api/tvshows/${tvShow._id}/watch`, watchData);
      console.log('TV show watch history tracked:', watchData);
    } catch (error) {
      console.error('Error tracking TV show watch history:', error);
    }
  }, [tvShow._id, season, episode]);

  // Add/remove body class to prevent popups when player is open
  useEffect(() => {
    document.body.classList.add('player-open');
    
    // Prevent navigation away from the page
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    
    // Prevent popups and redirects
    const popupBlocker = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Blocked potential popup');
    };
    
    // Intercept postMessage attempts from iframe
    const messageHandler = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'string') {
        if (e.data.includes('redirect') || e.data.includes('location') || e.data.includes('window.open')) {
          console.log('Blocked dangerous postMessage');
          e.stopImmediatePropagation();
        }
      }
    };
    
    // Store original open function and block it
    const originalOpen = window.open;
    window.open = function(...args) {
      console.log('Blocked window.open');
      return null;
    };
    
    // Monitor for redirect attempts
    let lastUrl = window.location.href;
    const urlChecker = setInterval(() => {
      if (window.location.href !== lastUrl && !window.location.href.includes(window.location.origin)) {
        window.history.back();
        console.log('Prevented redirect');
        lastUrl = window.location.href;
      }
    }, 100);
    
    window.addEventListener('beforeunload', beforeUnloadHandler, { capture: true });
    window.addEventListener('popstate', popupBlocker, { capture: true });
    window.addEventListener('message', messageHandler, { capture: true });
    
    // Lock scroll and prevent navigation
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.classList.remove('player-open');
      window.removeEventListener('beforeunload', beforeUnloadHandler, { capture: true });
      window.removeEventListener('popstate', popupBlocker, { capture: true });
      window.removeEventListener('message', messageHandler, { capture: true });
      clearInterval(urlChecker);
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      window.open = originalOpen;
      
      // Track watch history when player is closed
      trackWatchHistory(false);
    };
  }, [onClose, trackWatchHistory]);

  // Generate streaming URL for the current episode
  useEffect(() => {
    const generateStreamingUrl = async () => {
      try {
        // If we have a Vidsrc URL for the show, use it
        if (tvShow.vidsrcUrl) {
          setStreamingUrl(tvShow.vidsrcUrl);
          return;
        }

        // Otherwise, try to generate one using the Vidsrc service
        if (tvShow.tmdbId || tvShow.imdbId) {
          const vidsrcService = (await import('../services/vidsrcService')).default;
          const url = await vidsrcService.generateUrl({
            type: 'tv',
            tmdbId: tvShow.tmdbId || undefined,
            imdbId: tvShow.imdbId || undefined,
            season: season,
            episode: episode,
            options: {
              autoplay: 1,
              dsLang: 'en'
            }
          });
          setStreamingUrl(url);
        }
      } catch (error) {
        console.error('Error generating streaming URL:', error);
        setVideoError('Failed to load episode. Please try again.');
      }
    };

    generateStreamingUrl();
  }, [tvShow, season, episode]);

  // Mock episode data - in a real app, you'd fetch this from your API
  useEffect(() => {
    setCurrentEpisode({
      seasonNumber: season,
      episodeNumber: episode,
      name: `Episode ${episode}`,
      overview: `Season ${season}, Episode ${episode} of ${tvShow.name}`,
      airDate: tvShow.firstAirDate,
      vidsrcUrl: streamingUrl || undefined
    });
  }, [season, episode, tvShow, streamingUrl]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full relative ad-block-wrapper">
        {/* Video Element or Vidsrc Iframe */}
        {streamingUrl ? (
          <iframe
            src={streamingUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${tvShow.name} - Season ${season}, Episode ${episode}`}
            key={`vidsrc-${season}-${episode}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📺</div>
              <h3 className="text-xl font-semibold mb-2">Loading Episode...</h3>
              <p className="text-gray-400">Please wait while we prepare your content</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {videoError && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Episode Error</h3>
              <p className="text-gray-300 mb-4">{videoError}</p>
              <Button
                onClick={() => {
                  setVideoError(null);
                  // Retry loading
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            ✕
          </Button>
        </div>

        {/* Episode Info Sidebar */}
        {currentEpisode && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 max-w-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Tv className="w-4 h-4 text-blue-400" />
              <span className="text-white font-semibold">Episode Info</span>
            </div>
            <h4 className="text-white font-medium mb-1">{currentEpisode.name}</h4>
            <p className="text-gray-300 text-sm mb-2">{currentEpisode.overview}</p>
            {currentEpisode.airDate && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>Aired {formatDate(currentEpisode.airDate)}</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default TvShowPlayer;
