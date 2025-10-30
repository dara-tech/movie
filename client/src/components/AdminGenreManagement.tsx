import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { Tag, Edit, Trash2, Search, RefreshCw, AlertTriangle, Calendar, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Genre {
  _id: string;
  name: string;
  tmdbId?: number;
  createdAt: string;
  updatedAt?: string;
  tvShowCount?: number;
}

const AdminGenreManagement: React.FC = () => {
  const { user } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Sync states
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchGenres = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all genres with TV show counts
      const response = await api.get('/api/genres/with-counts');
      console.log('Genres API Response:', response.data);
      
      if (Array.isArray(response.data)) {
        setGenres(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      } else {
        setError('Invalid response format');
      }
    } catch (err: any) {
      console.error('Failed to fetch genres:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch genres');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      fetchGenres();
    }
  }, [user, fetchGenres]);

  const filteredGenres = genres
    .filter(genre =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'tmdbId':
          aValue = a.tmdbId || 0;
          bValue = b.tmdbId || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const paginatedGenres = filteredGenres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };

  const handleDeleteClick = (genre: Genre) => {
    setGenreToDelete(genre);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!genreToDelete) return;
    
    try {
      setDeleting(true);
      await api.delete(`/api/admin/genres/${genreToDelete._id}`);
      setGenres(genres.filter(genre => genre._id !== genreToDelete._id));
      setDeleteModalOpen(false);
      setGenreToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete genre');
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncFromTMDB = async () => {
    try {
      setSyncing(true);
      setSyncMessage('Syncing genres from TMDB...');
      setError(null);
      
      await api.post('/api/sync/genres');
      setSyncMessage('Genres synced successfully! Refreshing...');
      
      // Refresh the genres list
      await fetchGenres();
      
      setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync genres from TMDB');
      setSyncMessage(null);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && genres.length === 0) {
    return <LoadingSpinner fullScreen text="Loading genres..." color="blue" size="lg" />;
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="p-3 items-center bg-blue-500/20 rounded-full border border-blue-500/30">
              <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Genre Management
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Manage movie and TV show genres
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-950 rounded-none shadow-sm border border-gray-900 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search genres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-950 text-white outline-none rounded-none border-gray-800 focus:border-0 focus:ring-0 ring-offset-0 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
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
                <SelectTrigger className="w-full bg-gray-950 text-white border-gray-800 rounded-none focus:ring-0 focus:border-0 ring-offset-0 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 text-white border-gray-800 rounded-none">
                  <SelectItem value="name-asc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Name A-Z</SelectItem>
                  <SelectItem value="name-desc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Name Z-A</SelectItem>
                  <SelectItem value="tmdbId-asc" className="text-white hover:bg-gray-700 focus:bg-gray-700">TMDB ID Low-High</SelectItem>
                  <SelectItem value="tmdbId-desc" className="text-white hover:bg-gray-700 focus:bg-gray-700">TMDB ID High-Low</SelectItem>
                  <SelectItem value="createdAt-desc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc" className="text-white hover:bg-gray-700 focus:bg-gray-700">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleSyncFromTMDB}
                disabled={syncing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Sync from TMDB</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-400">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <p className="font-medium">{syncMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Genres Grid */}
        <div className="bg-gray-950 rounded-none shadow-sm border border-gray-900">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Genres ({filteredGenres.length})
              </h3>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {paginatedGenres.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                {paginatedGenres.map((genre) => (
                  <div key={genre._id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700/50 overflow-hidden hover:shadow-2xl hover:border-gray-600/50 transition-all duration-300 group transform hover:-translate-y-1">
                    <div className="relative overflow-hidden">
                      <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                        <div className="p-3 sm:p-4 bg-blue-600/20 rounded-full backdrop-blur-sm">
                          <Tag className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
                        </div>
                      </div>
                      
                      {/* Genre Name Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-4">
                        <h4 className="font-bold text-white text-sm sm:text-lg leading-tight">
                          {genre.name}
                        </h4>
                      </div>
                      
                      {/* TMDB ID Badge */}
                      {genre.tmdbId && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                          <div className="flex items-center bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 sm:px-2.5 sm:py-1.5">
                            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-400 fill-current" />
                            <span className="text-xs text-white font-semibold ml-1 hidden sm:inline">
                              {genre.tmdbId}
                            </span>
                            <span className="text-xs text-white font-semibold ml-1 sm:hidden">
                              {genre.tmdbId}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay with Quick Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="flex space-x-2 sm:space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <button
                            className="p-2 sm:p-3 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 backdrop-blur-sm transition-all duration-200"
                            title="Edit Genre"
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(genre)}
                            className="p-2 sm:p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 backdrop-blur-sm transition-all duration-200"
                            title="Delete Genre"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-5">
                      <div className="mb-3 sm:mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                            <span className="text-xs sm:text-sm">{formatDate(genre.createdAt)}</span>
                          </div>
                          <div className="text-xs bg-gray-700/50 px-2 py-1 rounded-full self-start sm:self-auto">
                            {genre.tvShowCount || 0} shows
                          </div>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-700/50">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs font-medium text-green-400">
                            Active
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {genre._id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Tag className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No genres found</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">Try adjusting your search or filter criteria to discover more content</p>
                {error && (
                  <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/50 rounded-xl p-4 max-w-md mx-auto backdrop-blur-sm">
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-300">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Previous page"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Next page"
                    >
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Genre</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete the genre "{genreToDelete?.name}"? This action cannot be undone.
              {genreToDelete?.tvShowCount && genreToDelete.tvShowCount > 0 && (
                <span className="block mt-2 text-yellow-400">
                  ⚠️ This genre is used by {genreToDelete.tvShowCount} TV show(s). Deleting it may affect those shows.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Genre'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGenreManagement;

