import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import {
  Users,
  Search,

  Trash2,
  UserCheck,
  UserX,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Heart,
  Activity,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
  preferences?: {
    assistantName: string;
    theme: 'light' | 'dark';
    language: string;
  };
}

interface UserStats {
  watchlist: number;
  watchHistory: number;
  memories: number;
  tasks: number;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'all' && { isActive: statusFilter }),
        sortBy,
        order: sortOrder
      });

      const response = await api.get(`/api/admin/users?${params}`);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch users:', err.response?.data?.message || err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}`);
      setSelectedUser(response.data.data.user);
      setUserStats({
        watchlist: response.data.data.watchlist.length,
        watchHistory: response.data.data.watchHistory.length,
        memories: response.data.data.memories.length,
        tasks: response.data.data.tasks.length
      });
      setShowUserDetails(true);
    } catch (err: any) {
      console.error('Failed to fetch user details:', err.response?.data?.message || err);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}`, updates);
      setUsers(users.map(user => user._id === userId ? response.data.data : user));
    } catch (err: any) {
      console.error('Failed to update user:', err.response?.data?.message || err);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { isActive });
    } catch (err: any) {
      console.error('Failed to update user status:', err.response?.data?.message || err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
    } catch (err: any) {
      console.error('Failed to delete user:', err.response?.data?.message || err);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && users.length === 0) {
    return (
      <LoadingSpinner fullScreen text="Loading users..." color="red" size="xl" />
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <Users className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              User Management
            </h1>
          </div>
          <p className="text-gray-400 ml-11">
            Manage users, roles, and permissions
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-white placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full bg-gray-800/50 border-gray-700/50 text-white rounded-none">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-gray-800/50 border-gray-700/50 text-white rounded-none">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-full bg-gray-800/50 border-gray-700/50 text-white rounded-none">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="username-asc">Username A-Z</SelectItem>
                  <SelectItem value="username-desc">Username Z-A</SelectItem>
                  <SelectItem value="lastLogin-desc">Last Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-none border border-gray-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800/50">
              <thead className="bg-gray-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900/30 divide-y divide-gray-800/30">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => fetchUserDetails(user._id)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="View Details"
                          aria-label="View user details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user._id, !user.isActive)}
                          className={`p-2 rounded-lg transition-all ${
                            user.isActive 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' 
                              : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                          }`}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                          aria-label={user.isActive ? "Deactivate user" : "Activate user"}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete User"
                          aria-label="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-800/30 px-6 py-4 flex items-center justify-between border-t border-gray-800/30">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-600/50 text-sm font-medium rounded-lg text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600/50 text-sm font-medium rounded-lg text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing page <span className="font-medium text-white">{currentPage}</span> of{' '}
                  <span className="font-medium text-white">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-600/50 bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-600/50 bg-gray-800/50 text-sm font-medium text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-2xl rounded-xl bg-gray-900/95 backdrop-blur-sm border-gray-800/50">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    User Details
                  </h3>
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg transition-all"
                    aria-label="Close user details"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Username
                        </label>
                        <p className="text-white font-medium">
                          {selectedUser.username}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email
                        </label>
                        <p className="text-white font-medium">
                          {selectedUser.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Role
                        </label>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                          {selectedUser.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status
                        </label>
                        <div className="mt-1">
                          {getStatusBadge(selectedUser.isActive)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  {userStats && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">
                        Activity Statistics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <Heart className="h-6 w-6 text-red-400 mx-auto mb-2" />
                          <p className="text-lg font-bold text-white">
                            {userStats.watchlist}
                          </p>
                          <p className="text-xs text-gray-400">
                            Watchlist
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <Activity className="h-6 w-6 text-green-400 mx-auto mb-2" />
                          <p className="text-lg font-bold text-white">
                            {userStats.watchHistory}
                          </p>
                          <p className="text-xs text-gray-400">
                            Watch History
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <BookOpen className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                          <p className="text-lg font-bold text-white">
                            {userStats.memories}
                          </p>
                          <p className="text-xs text-gray-400">
                            Memories
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          <CheckSquare className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                          <p className="text-lg font-bold text-white">
                            {userStats.tasks}
                          </p>
                          <p className="text-xs text-gray-400">
                            Tasks
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Created
                        </label>
                        <p className="text-white font-medium">
                          {formatDate(selectedUser.createdAt)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Login
                        </label>
                        <p className="text-white font-medium">
                          {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Login Count
                        </label>
                        <p className="text-white font-medium">
                          {selectedUser.loginCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="px-6 py-2.5 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;