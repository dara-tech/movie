import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Activity,Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import environment from '../config/environment';

interface AdminActivityItem {
  _id: string;
  admin: {
    username: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  description: string;
  details: any;
  success: boolean;
  createdAt: string;
  ipAddress?: string;
}

interface ActivityStats {
  total: number;
  success: number;
  failed: number;
  successRate: string;
  byAction: Array<{ _id: string; count: number }>;
  byAdmin: Array<{ admin: { username: string; email: string }; count: number }>;
  recent: AdminActivityItem[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
};

const AdminActivity: React.FC = () => {
  const [activities, setActivities] = useState<AdminActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    success: '',
    adminId: ''
  });

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [page, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.success && { success: filters.success }),
        ...(filters.adminId && { adminId: filters.adminId })
      });

      const response = await fetch(`${environment.API_URL}/api/admin/activity?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data.activities);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${environment.API_URL}/api/admin/activity/stats?period=30d`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('delete')) return '🗑️';
    if (action.includes('update')) return '✏️';
    if (action.includes('create')) return '➕';
    return '📋';
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('update')) return 'text-blue-400';
    if (action.includes('create')) return 'text-green-400';
    return 'text-gray-400';
  };

  const resourceOptions = ['', 'user', 'movie', 'tvshow', 'genre', 'system', 'settings'];
  const actionOptions = ['', 'user_update', 'user_deactivate', 'movie_availability', 'movie_delete', 'tvshow_availability', 'tvshow_delete', 'genre_delete'];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <Activity className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Admin Activity Logs
            </h1>
          </div>
          <p className="text-gray-400 ml-11">Track all admin actions and system activities</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">Total Activities</span>
                <Activity className="h-5 w-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">Successful</span>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">{stats.success}</div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">Failed</span>
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm font-medium">Success Rate</span>
                <div className="text-3xl font-bold text-red-400">{stats.successRate}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
              <select
                title="Filter by action type"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-none text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
              >
              {actionOptions.map(option => (
                <option key={option} value={option}>
                  {option || 'All Actions'}
                </option>
              ))}
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Resource</label>
              <select
                title="Filter by resource type"
                value={filters.resource}
                onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-none text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
              >
              {resourceOptions.map(option => (
                <option key={option} value={option}>
                  {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'All Resources'}
                </option>
              ))}
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                title="Filter by status"
                value={filters.success}
                onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-none text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
              >
              <option value="">All Status</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ action: '', resource: '', success: '', adminId: '' })}
                className="w-full px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700/50 rounded-none transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Activities List */}
        {loading ? (
          <LoadingSpinner text="Loading activities..." />
        ) : (
          <>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800/50">
                  <thead className="bg-gray-800/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/30 divide-y divide-gray-800/30">
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          No activities found
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity) => (
                        <tr key={activity._id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                <Activity className="h-5 w-5 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{activity.admin.username}</div>
                                <div className="text-sm text-gray-400">{activity.admin.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getActionIcon(activity.action)}</span>
                              <span className={`${getActionColor(activity.action)} font-mono text-sm`}>
                                {activity.action}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium">
                              {activity.resource}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-md">
                            <span className="text-gray-300 text-sm">{activity.description}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activity.success ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                <CheckCircle className="h-3 w-3" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                <XCircle className="h-3 w-3" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(activity.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-800/30 px-6 py-4 flex items-center justify-between border-t border-gray-800/30 mt-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-600/50 text-sm font-medium rounded-lg text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600/50 text-sm font-medium rounded-lg text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing page <span className="font-medium text-white">{page}</span> of{' '}
                      <span className="font-medium text-white">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-600/50 bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-600/50 bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;

