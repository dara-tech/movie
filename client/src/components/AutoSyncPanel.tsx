import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Play, Pause, RefreshCw, Clock, Database, AlertCircle, CheckCircle, Film, Tv, TrendingUp, Eye } from 'lucide-react';
import api from '../services/api';

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  stats: {
    totalMovies: number;
    newMovies: number;
    updatedMovies: number;
    totalTvShows: number;
    newTvShows: number;
    updatedTvShows: number;
    vidsrcUrls: number;
    errors: number;
  };
  scheduledJobs: string[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const AutoSyncPanel: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [syncConfig, setSyncConfig] = useState({
    pages: 5,
    includeTrending: true,
    includePopular: true,
    includeTopRated: false,
    includeUpcoming: false,
    schedule: 'daily',
    customCron: '0 2 * * *',
    dailyHour: 2
  });

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/auto-sync/status');
      const newStatus = response.data.data;
      
      // Only log if status changed
      if (status && status.isRunning !== newStatus.isRunning) {
        addLog(newStatus.isRunning ? 'success' : 'info', `Auto-sync ${newStatus.isRunning ? 'started' : 'stopped'}`);
      }
      
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }, [status]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
  };

  const startAutoSync = async () => {
    setLoading(true);
    addLog('info', 'Starting auto-sync...');
    try {
      const schedule = syncConfig.schedule === 'custom' 
        ? syncConfig.customCron 
        : syncConfig.schedule === 'daily' 
          ? `0 ${syncConfig.dailyHour} * * *`
          : '0 2 * * *';

      await api.post('/api/auto-sync/start', {
        schedule,
        pages: syncConfig.pages,
        includeTrending: syncConfig.includeTrending,
        includePopular: syncConfig.includePopular,
        includeTopRated: syncConfig.includeTopRated,
        includeUpcoming: syncConfig.includeUpcoming
      });

      addLog('success', 'Auto-sync started successfully');
      
      // Immediately update local state for instant UI feedback
      setStatus(prev => prev ? { ...prev, isRunning: true } : prev);
      
      // Fetch fresh status to confirm
      await fetchStatus();
      
      // Force one more fetch after a short delay to ensure consistency
      setTimeout(() => fetchStatus(), 1000);
    } catch (error) {
      addLog('error', 'Failed to start auto-sync');
      console.error('Failed to start auto-sync:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopAutoSync = async () => {
    setLoading(true);
    addLog('info', 'Stopping auto-sync...');
    try {
      await api.post('/api/auto-sync/stop');
      
      addLog('success', 'Auto-sync stopped successfully');
      
      // Immediately update local state for instant UI feedback
      setStatus(prev => prev ? { ...prev, isRunning: false } : prev);
      
      // Fetch fresh status to confirm
      await fetchStatus();
      
      // Force one more fetch after a short delay to ensure consistency
      setTimeout(() => fetchStatus(), 1000);
    } catch (error) {
      addLog('error', 'Failed to stop auto-sync');
      console.error('Failed to stop auto-sync:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncNow = async () => {
    setLoading(true);
    addLog('info', 'Initiating manual sync...');
    try {
      const response = await api.post('/api/auto-sync/sync-now', {
        pages: syncConfig.pages,
        includeTrending: syncConfig.includeTrending,
        includePopular: syncConfig.includePopular,
        includeTopRated: syncConfig.includeTopRated,
        includeUpcoming: syncConfig.includeUpcoming
      });
      
      // Check if sync started successfully
      if (response.data && response.data.success) {
        addLog('success', 'Sync started in background');
        addLog('info', `Processing ${syncConfig.pages} pages from selected categories`);
        await fetchStatus();
      } else {
        addLog('warning', 'Failed to start sync');
      }
    } catch (error) {
      addLog('error', 'Failed to initiate manual sync');
      console.error('Failed to sync now:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Auto Sync Management</h1>
            <p className="text-gray-400">Automated content synchronization system</p>
          </div>
          <Button
            onClick={() => setShowLogs(!showLogs)}
            variant="outline"
            className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showLogs ? 'Hide Logs' : 'View Logs'}
          </Button>
        </div>

        {/* Status Card */}
        <div className="bg-gradient-to-br from-gray-950 to-black border border-gray-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-red-500" />
              Sync Status
            </h2>
            {status && (
              <Badge className={`${status.isRunning ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {status.isRunning ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Running
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Stopped
                  </>
                )}
              </Badge>
            )}
          </div>

          {status ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400 text-sm">Movies</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{status.stats.totalMovies}</div>
                  <div className="text-xs text-green-400 mt-1">+{status.stats.newMovies} new</div>
                </div>

                <div className="bg-gray-900/50 p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Tv className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-400 text-sm">TV Shows</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{status.stats.totalTvShows || 0}</div>
                  <div className="text-xs text-green-400 mt-1">+{status.stats.newTvShows || 0} new</div>
                </div>

                <div className="bg-gray-900/50 p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-orange-400" />
                    <span className="text-gray-400 text-sm">Updated</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{status.stats.updatedMovies + (status.stats.updatedTvShows || 0)}</div>
                  <div className="text-xs text-gray-400 mt-1">items updated</div>
                </div>

                <div className="bg-gray-900/50 p-4 border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    {status.stats.errors > 0 ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <span className="text-gray-400 text-sm">Errors</span>
                  </div>
                  <div className={`text-2xl font-bold ${status.stats.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {status.stats.errors}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">this sync</div>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Last Sync: <span className="text-white">{formatDate(status.lastSync)}</span></span>
                </div>
              </div>
            </div>
          ) : (
            <LoadingSpinner text="Loading status..." color="red" />
          )}
        </div>

        {/* Configuration Card */}
        <div className="bg-gradient-to-br from-gray-950 to-black border border-gray-800 p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-red-500" />
            Sync Configuration
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pages" className="text-gray-300">Pages to Sync</Label>
                <Input
                  id="pages"
                  type="number"
                  min="1"
                  max="20"
                  value={syncConfig.pages}
                  onChange={(e) => setSyncConfig({ ...syncConfig, pages: parseInt(e.target.value) })}
                  className="bg-gray-950 border-gray-800 text-white mt-2 rounded-none focus:ring-0 focus:border-0 ring-offset-0"
                />
              </div>

              <div>
                <Label htmlFor="schedule" className="text-gray-300">Schedule</Label>
                <Select value={syncConfig.schedule} onValueChange={(value) => setSyncConfig({ ...syncConfig, schedule: value })}>
                  <SelectTrigger className="bg-gray-950 border-gray-800 text-white mt-2 rounded-none focus:ring-0 focus:border-0 ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-800 rounded-none">
                    <SelectItem value="hourly" className="text-white hover:bg-gray-700">Hourly</SelectItem>
                    <SelectItem value="daily" className="text-white hover:bg-gray-700">Daily</SelectItem>
                    <SelectItem value="twiceDaily" className="text-white hover:bg-gray-700">Twice Daily</SelectItem>
                    <SelectItem value="weekly" className="text-white hover:bg-gray-700">Weekly</SelectItem>
                    <SelectItem value="custom" className="text-white hover:bg-gray-700">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {syncConfig.schedule === 'daily' && (
                <div>
                  <Label htmlFor="dailyHour" className="text-gray-300">Daily Hour (UTC)</Label>
                  <Input
                    id="dailyHour"
                    type="number"
                    min="0"
                    max="23"
                    value={syncConfig.dailyHour}
                    onChange={(e) => setSyncConfig({ ...syncConfig, dailyHour: parseInt(e.target.value) })}
                    className="bg-gray-950 border-gray-800 text-white mt-2 rounded-none focus:ring-0 focus:border-0 ring-offset-0"
                  />
                </div>
              )}

              {syncConfig.schedule === 'custom' && (
                <div>
                  <Label htmlFor="customCron" className="text-gray-300">Custom Cron Expression</Label>
                  <Input
                    id="customCron"
                    value={syncConfig.customCron}
                    onChange={(e) => setSyncConfig({ ...syncConfig, customCron: e.target.value })}
                    placeholder="0 2 * * *"
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-gray-300">Content Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'trending', label: 'Trending', configKey: 'includeTrending' as const, checked: syncConfig.includeTrending },
                  { id: 'popular', label: 'Popular', configKey: 'includePopular' as const, checked: syncConfig.includePopular },
                  { id: 'topRated', label: 'Top Rated', configKey: 'includeTopRated' as const, checked: syncConfig.includeTopRated },
                  { id: 'upcoming', label: 'Upcoming', configKey: 'includeUpcoming' as const, checked: syncConfig.includeUpcoming }
                ].map(({ id, label, configKey, checked }) => (
                  <div key={id} className="flex items-center space-x-2 bg-gray-900/50 p-3 border rounded-full border-gray-800">
                    <Switch
                      id={id}
                      checked={checked}
                      onCheckedChange={(checked) => setSyncConfig({ ...syncConfig, [configKey]: checked })}
                      className="bg-gray-900 border-gray-700"
                    />
                    <Label htmlFor={id} className="text-gray-300 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={startAutoSync}
                disabled={loading || status?.isRunning}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 rounded-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Auto Sync
              </Button>
              <Button
                onClick={stopAutoSync}
                disabled={loading || !status?.isRunning}
                variant="outline"
                className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 disabled:text-gray-500 disabled:border-gray-800 disabled:opacity-50"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Auto Sync
              </Button>
              <Button
                onClick={syncNow}
                disabled={loading}
                variant="outline"
                className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800 disabled:text-gray-500 disabled:border-gray-800 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" color="red" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sync Now
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Logs */}
        {showLogs && (
          <div className="bg-gradient-to-br from-gray-950 to-black border border-gray-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Real-time Logs
            </h2>
            <div className="bg-black p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center mt-40">No logs yet</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <span className="text-gray-500 min-w-[80px]">{log.timestamp}</span>
                      <span className={`font-bold min-w-[60px] ${getLogColor(log.type)}`}>
                        [{log.type.toUpperCase()}]
                      </span>
                      <span className="text-gray-300">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSyncPanel;
