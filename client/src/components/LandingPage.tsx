import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Play, Star, Film, ArrowRight, CheckCircle, UserPlus } from 'lucide-react';
import api from '../services/api';

interface FeaturedContent {
  backdropPath?: string;
  posterPath?: string;
  title?: string;
  name?: string;
  overview?: string;
  type: 'movie' | 'tv';
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [posterGrid, setPosterGrid] = useState<FeaturedContent[]>([]);

  const fetchFeaturedContent = useCallback(async () => {
    try {
      const [trendingMoviesResponse, trendingTvResponse] = await Promise.all([
        api.get('/api/movies/trending?limit=50'),
        api.get('/api/tvshows/trending?limit=50')
      ]);

      const movies = trendingMoviesResponse.data.movies?.map((m: any) => ({
        backdropPath: m.backdropPath,
        posterPath: m.posterPath,
        title: m.title,
        overview: m.overview,
        id: m._id,
        type: 'movie' as const
      })) || [];

      const tvShows = trendingTvResponse.data.tvShows?.map((t: any) => ({
        backdropPath: t.backdropPath,
        posterPath: t.posterPath,
        name: t.name,
        overview: t.overview,
        id: t._id,
        type: 'tv' as const
      })) || [];

      // Combine and randomize all items
      const allItems = [...movies, ...tvShows].sort(() => Math.random() - 0.5);
      
      // Set poster grid - items with posters for the background grid
      const withPosters = allItems.filter(item => item.posterPath);
      setPosterGrid(withPosters);
    } catch (error) {
      console.error('Error fetching featured content:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedContent();
  }, [fetchFeaturedContent]);

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-700/50 bg-black/95 backdrop-blur">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MovieStream
              </h1>
            </div>

         
          </div>

          <div className="flex items-center gap-3">
            {/* <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800/50 transition-all duration-200"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button> */}
            <Button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-200"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Poster Grid Background */}
        <div className="absolute inset-0 bg-black overflow-hidden">
          {/* Animated light effects */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="absolute inset-0 grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 auto-rows-[minmax(100px,1fr)] gap-2 p-3">
            {posterGrid.map((content, index) => {
              const rotation = (Math.random() - 0.5) * 12;
              return (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg transform transition-all duration-500 hover:scale-105"
                  style={{
                    transform: `rotate(${rotation}deg)`
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-all duration-500 rounded-lg -z-10"></div>
                  
                  <img
                    src={`https://image.tmdb.org/t/p/w185${content.posterPath}`}
                    alt={content.title || content.name}
                    className="w-full h-full object-cover opacity-40 hover:opacity-60 transition-all duration-500 hover:brightness-125 hover:saturate-150"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '';
                    }}
                  />
                  
                  {/* Animated border on hover */}
                  <div className="absolute inset-0 border-2 border-white/0 hover:border-white/30 rounded-lg transition-all duration-500"></div>
                </div>
              );
            })}
          </div>
          
          {/* Dark overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
          
          {/* Animated scan lines */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              white 2px,
              white 4px
            )`
          }}></div>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Subtle glow behind text */}
          <div className="absolute -inset-10 blur-3xl bg-white/10 opacity-30"></div>
          
          <h1 className="relative text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">
            MovieStream
          </h1>
          <p className="relative text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto drop-shadow-2xl font-bold">
            Unlimited movies, TV shows, and more
          </p>
          <p className="relative text-lg md:text-xl text-gray-200 mb-4 drop-shadow-xl">
            Start watching. Start exploring. No registration required.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-12 relative z-10">
            <div className="text-center bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/10">
              <div className="text-3xl font-bold text-white mb-2">100,000+</div>
              <div className="text-gray-200">Movies Available</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/10">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-200">Streaming Available</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/10">
              <div className="text-3xl font-bold text-white mb-2">Free</div>
              <div className="text-gray-200">Registration</div>
            </div>
          </div>
        </div>

      </div>

      {/* Anime Card Slide Section */}
      <div className="py-20 px-6 bg-black">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Explore Our Collection
            </h2>
            <p className="text-xl text-gray-300">
              Discover trending movies and shows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {posterGrid.slice(0, 8).map((content, index) => {
              const animationDirection = index % 2 === 0 ? 'slideUp' : 'slideDown';
              const delay = index * 100;
              
              return (
                <div
                  key={index}
                  className="group relative aspect-[2/3] overflow-hidden rounded-xl hover:scale-105 transition-all duration-500"
                  style={{
                    animation: `${animationDirection} 0.8s ease-out ${delay}ms both`
                  }}
                >
                  {/* Full image */}
                  <img
                    src={`https://image.tmdb.org/t/p/w342${content.posterPath}`}
                    alt={content.title || content.name}
                    className="w-full h-full object-cover brightness-90 group-hover:brightness-110 transition-all duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '';
                    }}
                  />
                  
                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                  
                  {/* Title and info at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-base mb-2 line-clamp-2 drop-shadow-lg">
                      {content.title || content.name}
                    </h3>
                    <p className="text-gray-300 text-xs line-clamp-2 drop-shadow-md">
                      {content.overview}
                    </p>
                  </div>
                  
                  {/* Play button overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500 flex items-center justify-center">
                    <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100 fill-white" />
                  </div>
                  
                  {/* White glow on hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-500 pointer-events-none rounded-xl"></div>
                  
                  {/* Animated border on hover */}
                  <div className="absolute inset-0 border-4 border-transparent group-hover:border-white/40 rounded-xl transition-all duration-500 pointer-events-none"></div>
                </div>
              );
            })}
          </div>

          {/* Animated styles */}
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(100px) scale(0.8);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-100px) scale(0.8);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose MovieStream?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the best in movie streaming with our comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Film className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Massive Collection</h3>
              <p className="text-gray-400">
                Browse through 100,000+ movies from all genres and decades
              </p>
            </div>

            <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Streaming</h3>
              <p className="text-gray-400">
                Start watching immediately with our high-quality streaming
              </p>
            </div>

            <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Personalized Experience</h3>
              <p className="text-gray-400">
                Create watchlists and get personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-r from-gray-900 to-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Watching?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of movie lovers who have already discovered their next favorite film
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/movies')}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 text-lg font-semibold"
            >
              Browse Movies Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {/* <Button
              onClick={() => navigate('/register')}
              variant="outline"
              size="lg"
              className="border-gray-400 text-white hover:bg-white/20 px-8 py-4 text-lg font-semibold"
            >
              Create Free Account
            </Button> */}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No Credit Card Required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Instant Access
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Cancel Anytime
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">MovieStream</h3>
            <p className="text-gray-400 mb-6">
              Your gateway to unlimited movie entertainment
            </p>
            <div className="flex justify-center gap-6">
              <Button
                onClick={() => navigate('/movies')}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Browse Movies
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/register')}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Register
              </Button>
            </div>
            <div className="mt-8 text-sm text-gray-500">
              © 2025 MovieStream. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
