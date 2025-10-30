import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, Star, Clock, TrendingUp, Heart, History } from 'lucide-react';
import MovieGrid from './MovieGrid';
import MoviePlayer from './MoviePlayer';

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

interface DashboardStats {
  watchlist: {
    want_to_watch: number;
    watching: number;
    watched: number;
  };
  recentMovies: Movie[];
  popularMovies: Movie[];
  trendingMovies: Movie[];
}

const SkeletonCard: React.FC = () => (
  <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-gray-600 rounded-full animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-600 rounded animate-pulse"></div>
      </div>
      <div className="h-4 w-4 bg-gray-600 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-12 bg-gray-600 rounded animate-pulse mb-1"></div>
      <div className="h-3 w-16 bg-gray-600 rounded animate-pulse"></div>
    </CardContent>
  </Card>
);

const SkeletonQuickAction: React.FC = () => (
  <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50">
    <CardHeader className="p-6">
      <div className="w-16 h-16 rounded-xl bg-gray-600 animate-pulse mb-4"></div>
      <div className="h-5 w-24 bg-gray-600 rounded animate-pulse mb-2"></div>
      <div className="h-4 w-32 bg-gray-600 rounded animate-pulse"></div>
    </CardHeader>
  </Card>
);

const SkeletonMovieSection: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-6 w-32 bg-gray-600 rounded animate-pulse"></div>
        <div className="w-12 h-0.5 bg-gray-600 rounded-full animate-pulse"></div>
      </div>
      <div className="h-9 w-20 bg-gray-600 rounded animate-pulse"></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="aspect-[2/3] bg-gray-600 rounded-lg animate-pulse"></div>
          <div className="h-4 w-full bg-gray-600 rounded animate-pulse"></div>
          <div className="h-3 w-3/4 bg-gray-600 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    watchlist: { want_to_watch: 0, watching: 0, watched: 0 },
    recentMovies: [],
    popularMovies: [],
    trendingMovies: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    console.log('Dashboard: Component mounted, fetching data...');
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Dashboard: Fetching data...');
      // Always fetch popular and trending movies (no auth required)
      const [popularMovies, trendingMovies] = await Promise.all([
        api.get('/api/movies/popular?limit=6'),
        api.get('/api/movies/trending?limit=6')
      ]);

      console.log('Dashboard: Popular movies response:', popularMovies.data);
      console.log('Dashboard: Trending movies response:', trendingMovies.data);

      let watchlistStats = null;
      let recentMovies = [];

      // Only fetch user-specific data if logged in
      if (user) {
        try {
          const [watchlistResponse, historyResponse] = await Promise.all([
            api.get('/api/watchlist/stats'),
            api.get('/api/history/recent?limit=6')
          ]);
          watchlistStats = watchlistResponse.data;
          recentMovies = historyResponse.data.map((item: any) => item.movie);
        } catch (authError) {
          console.log('User not authenticated, skipping personal data');
        }
      }

      const newStats = {
        watchlist: watchlistStats,
        recentMovies: recentMovies,
        popularMovies: popularMovies.data.movies || [],
        trendingMovies: trendingMovies.data.movies || [],
      };
      
      console.log('Dashboard: Setting stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Browse Movies',
      description: 'Discover new movies',
      icon: <Play className="h-8 w-8" />,
      color: 'bg-red-600',
      onClick: () => navigate('/movies'),
    },
    {
      title: 'My Watchlist',
      description: 'View your saved movies',
      icon: <Heart className="h-8 w-8" />,
      color: 'bg-pink-600',
      onClick: () => navigate('/watchlist'),
    },
    {
      title: 'Watch History',
      description: 'See recently watched',
      icon: <History className="h-8 w-8" />,
      color: 'bg-blue-600',
      onClick: () => navigate('/history'),
    },
  ];

  const handlePlayMovie = (movie: Movie) => {
    console.log('Playing movie:', movie);
    console.log('Movie streaming URL:', movie.streamingUrl);
    setSelectedMovie(movie);
  };

  const handleAddToWatchlist = async (movie: Movie) => {
    if (!user) {
      showToast('Please log in to add movies to your watchlist', 'error');
      return;
    }
    
    try {
      await api.post(`/api/movies/${movie._id}/watchlist`);
      console.log(`Added "${movie.title}" to watchlist`);
      // Refresh data to update watchlist stats
      fetchDashboardData();
      showToast(`"${movie.title}" added to watchlist!`, 'success');
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      if (error.response?.status === 401) {
        showToast('Please log in to add movies to your watchlist', 'error');
      } else if (error.response?.status === 400) {
        showToast('This movie is already in your watchlist!', 'error');
      } else {
        showToast('Failed to add movie to watchlist. Please try again.', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-12 w-80 bg-gray-600 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-64 bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-24 h-1 bg-gray-600 rounded-full animate-pulse"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>

          {/* Quick Actions Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-32 bg-gray-600 rounded animate-pulse"></div>
              <div className="w-16 h-0.5 bg-gray-600 rounded-full animate-pulse"></div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonQuickAction key={index} />
              ))}
            </div>
          </div>

          {/* Movie Sections Skeleton */}
          <div className="space-y-10">
            <SkeletonMovieSection />
            <SkeletonMovieSection />
            <SkeletonMovieSection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className=" p-6 space-y-8">
        {/* Netflix-style Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {user ? `Welcome back, ${user.username}!` : 'Welcome to MovieStream!'}
              </h1>
              <p className="text-gray-400 text-lg mt-2">
                {user ? 'Discover your next favorite movie' : 'Sign in to personalize your experience'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Live streaming available</span>
            </div>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
        </div>

        {/* Advanced Stats Cards - Only show if user is logged in */}
        {user && stats.watchlist && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
                  Want to Watch
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{stats.watchlist.want_to_watch}</div>
                <p className="text-xs text-gray-400">Movies in queue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-red-400 rounded-full"></div>
                  Currently Watching
                </CardTitle>
                <Play className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{stats.watchlist.watching}</div>
                <p className="text-xs text-gray-400">In progress</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
                  Watched
                </CardTitle>
                <Star className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">{stats.watchlist.watched}</div>
                <p className="text-xs text-gray-400">Completed movies</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full"></div>
                  Total Movies
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.watchlist.want_to_watch + stats.watchlist.watching + stats.watchlist.watched}
                </div>
                <p className="text-xs text-gray-400">In your collection</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Quick Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Quick Actions</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 hover:scale-105 group"
                onClick={action.onClick}
              >
                <CardHeader className="p-6">
                  <div className={`w-16 h-16 rounded-xl ${action.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <CardTitle className="text-white text-lg group-hover:text-gray-200 transition-colors">{action.title}</CardTitle>
                  <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced Movie Sections */}
        <div className="space-y-10">
          {/* Trending Movies */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Trending Now</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/movies?filter=trending')}
                className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600/50 text-white hover:from-gray-700 hover:to-gray-600 transition-all duration-200 hover:scale-105"
              >
                View All
              </Button>
            </div>
            <MovieGrid
              movies={stats.trendingMovies}
              onPlay={handlePlayMovie}
              onAddToWatchlist={handleAddToWatchlist}
              loading={loading}
            />
          </div>

          {/* Popular Movies */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Popular Movies</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/movies?filter=popular')}
                className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600/50 text-white hover:from-gray-700 hover:to-gray-600 transition-all duration-200 hover:scale-105"
              >
                View All
              </Button>
            </div>
            <MovieGrid
              movies={stats.popularMovies}
              onPlay={handlePlayMovie}
              onAddToWatchlist={handleAddToWatchlist}
              loading={loading}
            />
          </div>

          {/* Recently Watched */}
          {stats.recentMovies.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Recently Watched</h2>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/history')}
                  className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600/50 text-white hover:from-gray-700 hover:to-gray-600 transition-all duration-200 hover:scale-105"
                >
                  View All
                </Button>
              </div>
              <MovieGrid
                movies={stats.recentMovies}
                onPlay={handlePlayMovie}
                onAddToWatchlist={handleAddToWatchlist}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Movie Player Modal */}
      {selectedMovie && (
        <MoviePlayer
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onWatchComplete={(movie: Movie) => {
            console.log('Movie completed:', movie.title);
            setSelectedMovie(null);
            // Refresh data to update watch history
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
