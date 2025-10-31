import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import {
  MdPeople,
  MdMovie,
  MdTv,
  MdTimeline,
  MdAccessTime,
  MdStar,
  MdWarning,
  MdStorage,
  MdSave,
  MdMemory,
  MdArrowUpward,
  MdArrowDownward,
  MdRemove,
} from 'react-icons/md';
import { Card } from './ui/card';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  content: {
    movies: number;
    tvShows: number;
    newMoviesThisMonth: number;
  };
  engagement: {
    watchlists: number;
    watchHistory: number;
  };
  recentUsers: Array<{
    _id: string;
    username: string;
    email: string;
    lastLogin: string;
    createdAt: string;
  }>;
  popularMovies: Array<{
    _id: string;
    title: string;
    popularity: number;
    voteAverage: number;
    posterPath: string;
  }>;
}

interface SystemHealth {
  database: {
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
  };
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  nodeVersion: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data if user has admin access
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      const [statsResponse, healthResponse] = await Promise.all([
        api.get('/api/admin/dashboard/stats'),
        api.get('/api/admin/system/health')
      ]);

      console.log('Dashboard data fetched:', { stats: statsResponse.data, health: healthResponse.data });
      
      if (statsResponse.data && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      }
      
      if (healthResponse.data && healthResponse.data.data) {
        setSystemHealth(healthResponse.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getGrowthIcon = (current: number, previous: number): React.ReactElement => {
    if (current > previous) return <MdArrowUpward className="h-4 w-4 text-red-500" />;
    if (current < previous) return <MdArrowDownward className="h-4 w-4 text-red-500" />;
    return <MdRemove className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <LoadingSpinner fullScreen text="Loading dashboard..." color="red" size="xl" />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <MdWarning className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-red-600 text-white  hover:bg-red-700 transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl">
            Overview of your MovieStream platform
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10">
            {/* Users Card */}
            <Card className="bg-gray-950 border-gray-800 rounded-none p-6 hover:bg-gray-800 transition-all duration-300 hover:scale-105 relative">
              <div className="p-2 bg-red-600  absolute top-4 right-4">
                <MdPeople className="h-4 w-4 text-white" />
              </div>
              <div className="pr-12">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                  Total Users
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {stats.users.total.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-red-500 flex items-center">
                  {getGrowthIcon(stats.users.newThisMonth, 0)}
                  <span className="ml-1 truncate">+{stats.users.newThisMonth} this month</span>
                </p>
              </div>
            </Card>

            {/* Active Users Card */}
            <Card className="bg-gray-950 border-gray-800 rounded-none p-4 sm:p-6 hover:bg-gray-800 transition-all duration-300 hover:scale-105 relative">
              <div className="p-2 bg-green-600  absolute top-4 right-4">
                <MdTimeline className="h-4 w-4 text-white" />
              </div>
              <div className="pr-12">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                  Active Users
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {stats.users.active.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {((stats.users.active / stats.users.total) * 100).toFixed(1)}% of total
                </p>
              </div>
            </Card>

            {/* Movies Card */}
            <Card className="bg-gray-950 border-gray-800 rounded-none p-4 sm:p-6 hover:bg-gray-800 transition-all duration-300 hover:scale-105 relative">
              <div className="p-2 bg-purple-600  absolute top-4 right-4">
                <MdMovie className="h-4 w-4 text-white" />
              </div>
              <div className="pr-12">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                  Movies
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {stats.content.movies.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-red-500 flex items-center">
                  {getGrowthIcon(stats.content.newMoviesThisMonth, 0)}
                  <span className="ml-1 truncate">+{stats.content.newMoviesThisMonth} this month</span>
                </p>
              </div>
            </Card>

            {/* TV Shows Card */}
            <Card className="bg-gray-950 border-gray-800 rounded-none p-4 sm:p-6 hover:bg-gray-800 transition-all duration-300 hover:scale-105 relative">
              <div className="p-2 bg-orange-600  absolute top-4 right-4">
                <MdTv className="h-4 w-4 text-white" />
              </div>
              <div className="pr-12">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                  TV Shows
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
                  {stats.content.tvShows.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  Total series
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8 md:mb-10">
          {/* Recent Users */}
          <Card className="bg-gray-950 border-gray-800 rounded-none overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Recent Users
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3  hover:bg-gray-800 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MdPeople className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {user.username}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0">
                        <span className="hidden sm:inline">{new Date(user.lastLogin).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No recent users
                </p>
              )}
            </div>
          </Card>

          {/* Popular Movies */}
          <Card className="bg-gray-950 border-gray-800 rounded-none overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Popular Movies
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {stats?.popularMovies && stats.popularMovies.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {stats.popularMovies.map((movie) => (
                    <div key={movie._id} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3  hover:bg-gray-800 transition-colors">
                      <div className="w-12 h-16 sm:w-16 sm:h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {movie.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MdMovie className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {movie.title}
                        </p>
                        <div className="flex items-center space-x-2 sm:space-x-3 mt-1 flex-wrap gap-y-1">
                          <div className="flex items-center">
                            <MdStar className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-400 ml-1">
                              {movie.voteAverage.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 hidden sm:block">
                            Popularity: {movie.popularity.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            Pop: {movie.popularity.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No popular movies
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* System Health */}
        {systemHealth && (
          <Card className="bg-gray-950 border-gray-800 rounded-none overflow-hidden mb-6 sm:mb-8 md:mb-10">
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                System Health
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="text-center p-3 sm:p-4 bg-gray-900 ">
                  <div className="p-2 sm:p-3 bg-blue-600  w-fit mx-auto mb-2 sm:mb-3">
                    <MdStorage className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Collections
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {systemHealth.database.collections}
                  </p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-gray-900 ">
                  <div className="p-2 sm:p-3 bg-green-600  w-fit mx-auto mb-2 sm:mb-3">
                    <MdSave className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Data Size
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-white">
                    {formatBytes(systemHealth.database.dataSize)}
                  </p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-gray-900 ">
                  <div className="p-2 sm:p-3 bg-purple-600  w-fit mx-auto mb-2 sm:mb-3">
                    <MdMemory className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Memory
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-white">
                    {formatBytes(systemHealth.memory.heapUsed)}
                  </p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-gray-900 ">
                  <div className="p-2 sm:p-3 bg-orange-600  w-fit mx-auto mb-2 sm:mb-3">
                    <MdAccessTime className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Uptime
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-white">
                    {formatUptime(systemHealth.uptime)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

       
      </div>
    </div>
  );
};

export default AdminDashboard;