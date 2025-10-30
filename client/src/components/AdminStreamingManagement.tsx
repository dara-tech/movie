import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { 
  Globe, 
  Settings, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Monitor,
  Zap,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface StreamingService {
  id: string;
  name: string;
  baseUrl: string;
  isEnabled: boolean;
  isWorking: boolean;
  lastChecked?: string;
  responseTime?: number;
  successRate?: number;
  totalRequests?: number;
  failedRequests?: number;
}

interface StreamingStats {
  totalMovies: number;
  moviesWithStreaming: number;
  totalTvShows: number;
  tvShowsWithStreaming: number;
  totalStreamingUrls: number;
  workingUrls: number;
  failedUrls: number;
  lastUpdated: string;
}

const AdminStreamingManagement: React.FC = () => {
  const { user } = useAuth();
  const [streamingServices, setStreamingServices] = useState<StreamingService[]>([]);
  const [streamingStats, setStreamingStats] = useState<StreamingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});
  
  // Modal states
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<StreamingService | null>(null);
  const [configUrl, setConfigUrl] = useState('');
  const [configEnabled, setConfigEnabled] = useState(true);

  const fetchStreamingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch streaming services configuration
      const servicesResponse = await api.get('/api/admin/streaming/services');
      setStreamingServices(servicesResponse.data || []);

      // Fetch streaming statistics
      const statsResponse = await api.get('/api/admin/streaming/stats');
      setStreamingStats(statsResponse.data || null);

    } catch (err: any) {
      console.error('Failed to fetch streaming data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch streaming data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      fetchStreamingData();
    }
  }, [user, fetchStreamingData]);

  const testService = async (serviceId: string) => {
    try {
      setTesting(serviceId);
      setError(null);

      const response = await api.post(`/api/admin/streaming/test/${serviceId}`);
      const isWorking = response.data.success;
      
      setTestResults(prev => ({ ...prev, [serviceId]: isWorking }));
      
      // Update the service status
      setStreamingServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { 
              ...service, 
              isWorking, 
              lastChecked: new Date().toISOString(),
              responseTime: response.data.responseTime
            }
          : service
      ));

    } catch (err: any) {
      console.error('Failed to test service:', err);
      setTestResults(prev => ({ ...prev, [serviceId]: false }));
    } finally {
      setTesting(null);
    }
  };

  const testAllServices = async () => {
    for (const service of streamingServices) {
      await testService(service.id);
    }
  };

  const toggleService = async (serviceId: string, enabled: boolean) => {
    try {
      await api.put(`/api/admin/streaming/services/${serviceId}`, { isEnabled: enabled });
      
      setStreamingServices(prev => prev.map(service => 
        service.id === serviceId ? { ...service, isEnabled: enabled } : service
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update service');
    }
  };

  const updateServiceConfig = async () => {
    if (!selectedService) return;

    try {
      await api.put(`/api/admin/streaming/services/${selectedService.id}`, {
        baseUrl: configUrl,
        isEnabled: configEnabled
      });

      setStreamingServices(prev => prev.map(service => 
        service.id === selectedService.id 
          ? { ...service, baseUrl: configUrl, isEnabled: configEnabled }
          : service
      ));

      setConfigModalOpen(false);
      setSelectedService(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update service configuration');
    }
  };

  const regenerateStreamingUrls = async () => {
    try {
      setLoading(true);
      await api.post('/api/admin/streaming/regenerate-urls');
      await fetchStreamingData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate streaming URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigClick = (service: StreamingService) => {
    setSelectedService(service);
    setConfigUrl(service.baseUrl);
    setConfigEnabled(service.isEnabled);
    setConfigModalOpen(true);
  };

  const getStatusIcon = (service: StreamingService) => {
    if (testing === service.id) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    }
    
    if (testResults[service.id] !== undefined) {
      return testResults[service.id] 
        ? <CheckCircle className="h-4 w-4 text-green-400" />
        : <XCircle className="h-4 w-4 text-red-400" />;
    }
    
    return service.isWorking 
      ? <CheckCircle className="h-4 w-4 text-green-400" />
      : <XCircle className="h-4 w-4 text-red-400" />;
  };

  const getStatusColor = (service: StreamingService) => {
    if (testing === service.id) return 'text-blue-400';
    if (testResults[service.id] !== undefined) {
      return testResults[service.id] ? 'text-green-400' : 'text-red-400';
    }
    return service.isWorking ? 'text-green-400' : 'text-red-400';
  };

  if (loading && !streamingServices.length) {
    return <LoadingSpinner fullScreen text="Loading streaming management..." color="blue" size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Streaming Management</h1>
              <p className="text-sm sm:text-base text-gray-400">Configure and monitor streaming services</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={testAllServices}
                disabled={testing !== null}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                size="sm"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Testing...</span>
                    <span className="sm:hidden">Testing</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Test All Services</span>
                    <span className="sm:hidden">Test All</span>
                  </>
                )}
              </Button>
              <Button 
                onClick={regenerateStreamingUrls}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                size="sm"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Regenerate URLs</span>
                <span className="sm:hidden">Regenerate</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Streaming Statistics */}
        {streamingStats && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Streaming Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-none p-3 sm:p-6 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-xs sm:text-sm font-medium">Total Movies</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{streamingStats.totalMovies}</p>
                  </div>
                  <Play className="h-5 w-5 sm:h-8 sm:w-8 text-blue-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-blue-300">
                  {streamingStats.moviesWithStreaming} with streaming
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-none p-3 sm:p-6 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-xs sm:text-sm font-medium">Total TV Shows</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{streamingStats.totalTvShows}</p>
                  </div>
                  <Monitor className="h-5 w-5 sm:h-8 sm:w-8 text-purple-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-purple-300">
                  {streamingStats.tvShowsWithStreaming} with streaming
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-none p-3 sm:p-6 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-xs sm:text-sm font-medium">Working URLs</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{streamingStats.workingUrls}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-green-300">
                  {streamingStats.totalStreamingUrls} total URLs
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-none p-3 sm:p-6 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-300 text-xs sm:text-sm font-medium">Failed URLs</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{streamingStats.failedUrls}</p>
                  </div>
                  <XCircle className="h-5 w-5 sm:h-8 sm:w-8 text-red-400" />
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-red-300">
                  {streamingStats.failedUrls > 0 ? 'Needs attention' : 'All good'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaming Services */}
        <div className="bg-black rounded-none shadow-lg border border-gray-800">
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Streaming Services</h3>
              <div className="text-xs sm:text-sm text-gray-400">
                {streamingServices.filter(s => s.isEnabled).length} of {streamingServices.length} enabled
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {streamingServices.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {streamingServices.map((service) => (
                  <div key={service.id} className="bg-gray-950 rounded-none p-3 sm:p-4 border border-gray-700">
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(service)}
                          <h4 className="font-semibold text-white text-sm">{service.name}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${getStatusColor(service)}`}>
                            {service.isWorking ? 'Working' : 'Not Working'}
                          </span>
                          {service.responseTime && (
                            <span className="text-xs text-gray-400">
                              ({service.responseTime}ms)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Enabled</span>
                          <Switch
                            checked={service.isEnabled}
                            onCheckedChange={(enabled) => toggleService(service.id, enabled)}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => testService(service.id)}
                            disabled={testing === service.id}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
                          >
                            {testing === service.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                          </Button>

                          <Button
                            onClick={() => handleConfigClick(service)}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>

                          <Button
                            onClick={() => window.open(service.baseUrl, '_blank')}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="truncate">URL: {service.baseUrl}</div>
                        {service.lastChecked && (
                          <div>Last checked: {new Date(service.lastChecked).toLocaleDateString()}</div>
                        )}
                        {service.successRate && (
                          <div>Success rate: {service.successRate}%</div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(service)}
                            <h4 className="font-semibold text-white">{service.name}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${getStatusColor(service)}`}>
                              {service.isWorking ? 'Working' : 'Not Working'}
                            </span>
                            {service.responseTime && (
                              <span className="text-xs text-gray-400">
                                ({service.responseTime}ms)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Enabled</span>
                            <Switch
                              checked={service.isEnabled}
                              onCheckedChange={(enabled) => toggleService(service.id, enabled)}
                            />
                          </div>
                          
                          <Button
                            onClick={() => testService(service.id)}
                            disabled={testing === service.id}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {testing === service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            onClick={() => handleConfigClick(service)}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>

                          <Button
                            onClick={() => window.open(service.baseUrl, '_blank')}
                            size="sm"
                            variant="default"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span>URL: {service.baseUrl}</span>
                          {service.lastChecked && (
                            <span>Last checked: {new Date(service.lastChecked).toLocaleString()}</span>
                          )}
                          {service.successRate && (
                            <span>Success rate: {service.successRate}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Globe className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-2">No Streaming Services</h3>
                <p className="text-sm sm:text-base text-gray-400">Configure streaming services to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Modal */}
        <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
          <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Configure Streaming Service</DialogTitle>
              <DialogDescription className="text-gray-300 text-sm sm:text-base">
                Update the configuration for {selectedService?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base URL
                </label>
                <Input
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-gray-900 border-gray-800 text-white text-sm sm:text-base"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={configEnabled}
                  onCheckedChange={setConfigEnabled}
                />
                <label className="text-sm font-medium text-gray-300">
                  Enable Service
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
                onClick={updateServiceConfig}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminStreamingManagement;
