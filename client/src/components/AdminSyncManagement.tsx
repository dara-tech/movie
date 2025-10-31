/* eslint-disable react/no-unknown-property, @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database,
  Film,
  Tv,
  Tag,
  Users,
  Clock,
  Loader2,
  Play,
  Pause,
  Settings,
  Download,
  Square,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface SyncLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface SyncJob {
  _id?: string;
  id?: string;
  name: string;
  type: 'movies' | 'tvshows' | 'genres' | 'users' | 'all';
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  lastRun?: string;
  nextRun?: string;
  isEnabled: boolean;
  description: string;
  estimatedTime?: string;
  itemsProcessed?: number;
  totalItems?: number;
  errorMessage?: string;
  lastError?: string;
  successCount?: number;
  failureCount?: number;
  config?: any;
  logs?: SyncLog[];
}

// Helper function to get job ID
const getJobId = (job: SyncJob): string => {
  return job._id || job.id || '';
};

interface SyncStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  lastSyncTime?: string;
  totalItemsSynced: number;
  syncSuccessRate: number;
}

const AdminSyncManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Helper function for progress bar style
  const getProgressBarStyle = (progress: number) => ({
    width: `${progress}%`
  });
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Modal states
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [selectedJobLogs, setSelectedJobLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  const fetchSyncData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sync jobs configuration
      const jobsResponse = await api.get('/api/admin/sync/jobs');
      setSyncJobs(jobsResponse.data || []);

      // Fetch sync statistics
      const statsResponse = await api.get('/api/admin/sync/stats');
      setSyncStats(statsResponse.data || null);

    } catch (err: any) {
      console.error('Failed to fetch sync data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch sync data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      fetchSyncData();
      
      // Auto-refresh every 3 seconds to show real-time status
      const interval = setInterval(() => {
        fetchSyncData();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [user, fetchSyncData]);

  const runSyncJob = async (jobId: string) => {
    try {
      setRunningJobs(prev => new Set(prev).add(jobId));
      setError(null);
      setSyncMessage(`Starting sync job...`);

      await api.post(`/api/admin/sync/run/${jobId}`);
      
      setSyncMessage(`Sync job completed successfully!`);
      setTimeout(() => setSyncMessage(null), 3000);
      
      // Refresh data
      await fetchSyncData();

    } catch (err: any) {
      console.error('Failed to run sync job:', err);
      setError(err.response?.data?.message || 'Failed to run sync job');
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const runAllSyncJobs = async () => {
    try {
      setError(null);
      setSyncMessage(`Starting all sync jobs...`);

      await api.post('/api/admin/sync/run-all');
      
      setSyncMessage(`All sync jobs completed successfully!`);
      setTimeout(() => setSyncMessage(null), 3000);
      
      // Refresh data
      await fetchSyncData();

    } catch (err: any) {
      console.error('Failed to run all sync jobs:', err);
      setError(err.response?.data?.message || 'Failed to run all sync jobs');
    }
  };

  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      await api.put(`/api/admin/sync/jobs/${jobId}`, { isEnabled: enabled });
      
      setSyncJobs(prev => prev.map(job => 
        getJobId(job) === jobId ? { ...job, isEnabled: enabled } : job
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update job');
    }
  };

  const stopSyncJob = async (jobId: string) => {
    try {
      setRunningJobs(prev => new Set(prev).add(jobId));
      setError(null);
      setSyncMessage(`Stopping sync job...`);

      await api.post(`/api/admin/sync/stop/${jobId}`);
      
      setSyncMessage(`Sync job stopped successfully`);
      setTimeout(() => setSyncMessage(null), 3000);
      
      // Refresh data
      await fetchSyncData();

    } catch (err: any) {
      console.error('Failed to stop sync job:', err);
      setError(err.response?.data?.message || 'Failed to stop sync job');
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const updateJobConfig = async () => {
    if (!selectedJob) return;

    try {
      await api.put(`/api/admin/sync/jobs/${getJobId(selectedJob)}`, {
        isEnabled: selectedJob.isEnabled,
        autoSyncEnabled
      });

      setSyncJobs(prev => prev.map(job => 
        getJobId(job) === getJobId(selectedJob)
          ? { ...job, isEnabled: selectedJob.isEnabled }
          : job
      ));

      setConfigModalOpen(false);
      setSelectedJob(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update job configuration');
    }
  };

  const handleConfigClick = (job: SyncJob) => {
    setSelectedJob(job);
    setAutoSyncEnabled(job.isEnabled);
    setConfigModalOpen(true);
  };

  const handleViewLogs = async (job: SyncJob) => {
    setSelectedJob(job);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setSelectedJobLogs([]);

    try {
      const jobId = getJobId(job);
      const response = await api.get(`/api/admin/sync/jobs/${jobId}/logs`);
      setSelectedJobLogs(response.data.logs || []);
      
      // Auto-refresh logs if job is running
      if (job.status === 'running' || runningJobs.has(jobId)) {
        const intervalId = setInterval(async () => {
          try {
            const refreshResponse = await api.get(`/api/admin/sync/jobs/${jobId}/logs`);
            setSelectedJobLogs(refreshResponse.data.logs || []);
          } catch (err) {
            console.error('Failed to refresh logs:', err);
          }
        }, 3000); // Refresh every 3 seconds
        
        // Clean up interval when modal closes
        const cleanup = () => {
          clearInterval(intervalId);
          setLogsModalOpen(false);
        };
        
        // Store cleanup function
        (window as any).logsCleanup = cleanup;
      }
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setError(err.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  const getStatusIcon = (job: SyncJob) => {
    if (runningJobs.has(getJobId(job))) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    }
    
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (job: SyncJob) => {
    if (runningJobs.has(getJobId(job))) return 'text-blue-400';
    
    switch (job.status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'running':
        return 'text-blue-400';
      case 'paused':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'movies':
        return <Film className="h-5 w-5" />;
      case 'tvshows':
        return <Tv className="h-5 w-5" />;
      case 'genres':
        return <Tag className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'all':
        return <Database className="h-5 w-5" />;
      default:
        return <RefreshCw className="h-5 w-5" />;
    }
  };

  if (loading && !syncJobs.length) {
    return <LoadingSpinner fullScreen text="Loading sync management..." color="blue" size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Sync Management</h1>
              <p className="text-sm sm:text-base text-gray-400">Manage data synchronization jobs</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={runAllSyncJobs}
                disabled={runningJobs.size > 0}
                className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                size="sm"
              >
                {runningJobs.size > 0 ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Running...</span>
                    <span className="sm:hidden">Running</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Run All Jobs</span>
                    <span className="sm:hidden">Run All</span>
                  </>
                )}
              </Button>
              <Button 
                onClick={fetchSyncData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                size="sm"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-none p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {syncMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500 rounded-none p-4">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">{syncMessage}</p>
            </div>
          </div>
        )}

        {/* Sync Statistics */}
        {syncStats && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Sync Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-none p-3 sm:p-6 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-xs sm:text-sm font-medium">Total Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{syncStats.totalJobs}</p>
                  </div>
                  <Database className="h-5 w-5 sm:h-8 sm:w-8 text-blue-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-blue-300">
                  {syncStats.activeJobs} active
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-none p-3 sm:p-6 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-xs sm:text-sm font-medium">Completed</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{syncStats.completedJobs}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-green-300">
                  {syncStats.syncSuccessRate}% success rate
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-none p-3 sm:p-6 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-xs sm:text-sm font-medium">Failed</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{syncStats.failedJobs}</p>
                  </div>
                  <XCircle className="h-5 w-5 sm:h-8 sm:w-8 text-red-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-red-300">
                  {syncStats.failedJobs > 0 ? 'Needs attention' : 'All good'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-none p-3 sm:p-6 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-xs sm:text-sm font-medium">Items Synced</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{syncStats.totalItemsSynced}</p>
                  </div>
                  <Download className="h-5 w-5 sm:h-8 sm:w-8 text-purple-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-purple-300">
                  {syncStats.lastSyncTime ? `Last: ${new Date(syncStats.lastSyncTime).toLocaleDateString()}` : 'Never'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Jobs */}
        <div className="bg-black rounded-none shadow-lg border border-gray-800">
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Sync Jobs</h3>
              <div className="text-xs sm:text-sm text-gray-400">
                {syncJobs.filter(j => j.isEnabled).length} of {syncJobs.length} enabled
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {syncJobs.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {syncJobs.map((job) => (
                  <div key={getJobId(job)} className="bg-gray-950 rounded-none p-3 sm:p-4 border border-gray-700">
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getJobIcon(job.type)}
                          <h4 className="font-semibold text-white text-sm">{job.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job)}
                          <span className={`text-xs ${getStatusColor(job)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Enabled</span>
                          <Switch
                            checked={job.isEnabled}
                            onCheckedChange={(enabled) => toggleJob(getJobId(job), enabled)}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {job.status === 'running' || runningJobs.has(getJobId(job)) ? (
                            <Button
                              onClick={() => stopSyncJob(getJobId(job))}
                              disabled={!runningJobs.has(getJobId(job))}
                              size="sm"
                              variant="default"
                              className="border-gray-600 text-gray-300 hover:bg-red-700 h-8 w-8 p-0"
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => runSyncJob(getJobId(job))}
                              disabled={!job.isEnabled}
                              size="sm"
                              variant="default"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            onClick={() => handleConfigClick(job)}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleViewLogs(job)}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
                            title="View Logs"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 space-y-1">
                        <div>{job.description}</div>
                        {job.progress > 0 && (
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-800 rounded-none h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-none transition-all duration-300" 
                                style={getProgressBarStyle(job.progress)}
                              />
                            </div>
                            <span>{job.progress}%</span>
                          </div>
                        )}
                        {job.lastRun && (
                          <div>Last run: {new Date(job.lastRun).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getJobIcon(job.type)}
                            <h4 className="font-semibold text-white">{job.name}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(job)}
                            <span className={`text-sm ${getStatusColor(job)}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </div>
                          {job.progress > 0 && (
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-800 rounded-none h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-none transition-all duration-300" 
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{job.progress}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Enabled</span>
                            <Switch
                              checked={job.isEnabled}
                              onCheckedChange={(enabled) => toggleJob(getJobId(job), enabled)}
                            />
                          </div>
                          
                          {job.status === 'running' || runningJobs.has(getJobId(job)) ? (
                            <Button
                              onClick={() => stopSyncJob(getJobId(job))}
                              disabled={!runningJobs.has(getJobId(job))}
                              size="sm"
                              variant="default"
                              className="border-gray-600 text-gray-300 hover:bg-red-700"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => runSyncJob(getJobId(job))}
                              disabled={!job.isEnabled}
                              size="sm"
                              variant="default"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            onClick={() => handleConfigClick(job)}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleViewLogs(job)}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            title="View Logs"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span>{job.description}</span>
                          {job.lastRun && (
                            <span>Last run: {new Date(job.lastRun).toLocaleString()}</span>
                          )}
                          {job.estimatedTime && (
                            <span>Est. time: {job.estimatedTime}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Database className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">No Sync Jobs</h3>
                <p className="text-sm sm:text-base text-gray-400">Configure sync jobs to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Modal */}
        <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
          <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Configure Sync Job</DialogTitle>
              <DialogDescription className="text-gray-300 text-sm sm:text-base">
                Update the configuration for {selectedJob?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
                <label className="text-sm font-medium text-gray-300">
                  Enable Auto Sync
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="destructive"
                onClick={() => setConfigModalOpen(false)}
                className="border-gray-600 text-white hover:bg-gray-800 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={updateJobConfig}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logs Modal */}
        <Dialog open={logsModalOpen} onOpenChange={(open) => {
          setLogsModalOpen(open);
          if (!open && (window as any).logsCleanup) {
            (window as any).logsCleanup();
            delete (window as any).logsCleanup;
          }
        }}>
          <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-4xl mx-auto max-h-[80vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-white text-lg sm:text-xl">Sync Logs</DialogTitle>
                  <DialogDescription className="text-gray-300 text-sm sm:text-base">
                    {selectedJob?.name} - Activity Logs
                    {(selectedJob?.status === 'running' || runningJobs.has(getJobId(selectedJob || {} as SyncJob))) && (
                      <span className="ml-2 text-green-400">● Live</span>
                    )}
                  </DialogDescription>
                </div>
             
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto mt-4">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-3 text-gray-400">Loading logs...</span>
                </div>
              ) : selectedJobLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No logs available for this sync job</p>
                </div>
              ) : (
                <div className="bg-black rounded-none p-4 space-y-2 font-mono text-sm max-h-[60vh] overflow-y-auto">
                  {selectedJobLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 pb-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-500 text-xs whitespace-nowrap mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-semibold uppercase text-xs ${getLogLevelColor(log.level)}`}>
                        [{log.level}]
                      </span>
                      <span className={`flex-1 ${getLogLevelColor(log.level)}`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {(selectedJob?.status === 'running' || runningJobs.has(getJobId(selectedJob || {} as SyncJob))) && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400 mr-2" />
                      <span className="text-xs text-gray-400">Live updates...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
          
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminSyncManagement;
