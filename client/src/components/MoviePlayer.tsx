import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
// import { Card, CardContent } from './ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Input } from './ui/input';
import api from '../services/api';
interface Movie {
  _id: string;
  title: string;
  overview?: string;
  releaseDate: string;
  voteAverage: number;
  genres: Array<{ name: string }>;
  runtime?: number;
  streamingUrl?: string;
  vidsrcUrl?: string;
  tmdbId?: number;
  imdbId?: string;
  posterPath?: string;
}

interface MoviePlayerProps {
  movie: Movie;
  onClose: () => void;
  onWatchComplete?: (movie: Movie) => void;
}

const MoviePlayer: React.FC<MoviePlayerProps> = ({
  movie,
  onClose,
  onWatchComplete
}) => {
  console.log('MoviePlayer received movie:', movie);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  // const [isFullscreen, setIsFullscreen] = useState(false);

  // Track watch history
  const trackWatchHistory = useCallback(async (completed: boolean = false) => {
    try {
      const video = videoRef.current;
      if (!video) return;

      const watchData = {
        duration: Math.floor(video.duration || 0),
        completed,
        lastPosition: Math.floor(video.currentTime || 0)
      };

      await api.post(`/api/movies/${movie._id}/watch`, watchData);
      console.log('Watch history tracked:', watchData);
    } catch (error) {
      console.error('Error tracking watch history:', error);
    }
  }, [movie._id]);

  // Get streaming URL - prioritize Vidsrc
  const getStreamingUrl = () => {
    // Use Vidsrc URL if available, otherwise fall back to streaming URL
    const url = movie.vidsrcUrl || movie.streamingUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
    console.log('Using streaming URL:', url);
    console.log('Movie Vidsrc URL available:', !!movie.vidsrcUrl);
    console.log('Movie TMDB ID:', movie.tmdbId);
    console.log('Movie IMDB ID:', movie.imdbId);
    return url;
  };

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
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      window.open = originalOpen;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      trackWatchHistory(true); // Mark as completed
      onWatchComplete?.(movie);
    };
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setVideoError('Failed to load video. Please try again.');
    };
    const handleLoadStart = () => {
      console.log('Video loading started');
      setVideoError(null);
    };
    const handleCanPlay = () => {
      console.log('Video can play');
      setVideoError(null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [movie, onWatchComplete, trackWatchHistory]);

  // Track progress every 30 seconds during playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      trackWatchHistory(false); // Track progress, not completed
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isPlaying, trackWatchHistory]);

  // Track when player is closed
  useEffect(() => {
    return () => {
      // Track final position when component unmounts
      trackWatchHistory(false);
    };
  }, [trackWatchHistory]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) {
      console.log('Video element not found');
      return;
    }

    console.log('Video state:', {
      paused: video.paused,
      readyState: video.readyState,
      src: video.src,
      currentSrc: video.currentSrc
    });

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
        console.log('Video started playing');
      } catch (error) {
        console.error('Error playing video:', error);
        setVideoError('Failed to play video. Please check your browser settings.');
      }
    } else {
      video.pause();
      setIsPlaying(false);
      console.log('Video paused');
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full relative ad-block-wrapper">
        {/* Video Element or Vidsrc Iframe */}
        {movie.vidsrcUrl ? (
          <iframe
            src={movie.vidsrcUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer-when-downgrade"
            title={movie.title}
            key={movie.vidsrcUrl ? 'vidsrc' : 'video'} // Force re-render when switching between iframe and video
            loading="lazy"
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            poster={`https://image.tmdb.org/t/p/w1280${movie.posterPath || '/placeholder-movie.jpg'}`}
            onClick={togglePlay}
            onMouseMove={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            controls={false}
            preload="metadata"
            key={movie.vidsrcUrl ? 'vidsrc' : 'video'} // Force re-render when switching between iframe and video
          >
            <source src={getStreamingUrl()} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {/* Error Display */}
        {videoError && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Video Error</h3>
              <p className="text-gray-300 mb-4">{videoError}</p>
              <Button
                onClick={() => {
                  setVideoError(null);
                  const video = videoRef.current;
                  if (video) {
                    video.load();
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Controls Overlay - Only show for video elements, not Vidsrc iframes */}
        {showControls && !movie.vidsrcUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-4">
            {/* Top Controls */}
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl font-semibold">{movie.title}</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-white text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const video = videoRef.current;
                      if (video) {
                        video.currentTime = Math.max(0, video.currentTime - 10);
                      }
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>


            </div>
          );
        };

export default MoviePlayer;
