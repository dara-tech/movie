import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import {
  MdStorage,
  MdMemory,
  MdComputer,
  MdTimeline
} from 'react-icons/md';
import { Card, CardContent } from './ui/card';

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

const AdminSystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await api.get('/api/admin/system/health');
      setHealth(response.data.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading system health..." color="blue" size="xl" />;
  }

  if (!health) {
    return (
      <Card className="min-h-screen bg-gray-950 flex items-center justify-center">
        <CardContent>
          <p className="text-red-400 text-xl">Failed to load system health</p>
        </CardContent>
        </Card>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <MdTimeline className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                System Health
              </h1>
              <p className="text-gray-400 mt-1">
                Monitor your system performance and resources
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Stats */}
          <Card className="rounded-none p-4 bg-gray-950 border-gray-800 sm:p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MdStorage className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">Database</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collections</span>
                <span className="text-white font-semibold">{health.database.collections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Data Size</span>
                <span className="text-white font-semibold">{formatBytes(health.database.dataSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Storage Size</span>
                <span className="text-white font-semibold">{formatBytes(health.database.storageSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Indexes</span>
                <span className="text-white font-semibold">{health.database.indexes}</span>
              </div>
            </div>
          </Card>

          {/* Memory Stats */}
          <Card className="rounded-none p-4 bg-gray-950 border-gray-800 sm:p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MdMemory className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Memory</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Heap Used</span>
                <span className="text-white font-semibold">{formatBytes(health.memory.heapUsed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Heap Total</span>
                <span className="text-white font-semibold">{formatBytes(health.memory.heapTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">RSS</span>
                <span className="text-white font-semibold">{formatBytes(health.memory.rss)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">External</span>
                <span className="text-white font-semibold">{formatBytes(health.memory.external)}</span>
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card className="rounded-none p-4 bg-gray-950 border-gray-800 sm:p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MdComputer className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">System Info</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Node Version</span>
                <span className="text-white font-semibold">{health.nodeVersion}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Uptime</span>
                <span className="text-white font-semibold">{formatUptime(health.uptime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className="px-3 py-1 bg-green-600 text-white text-sm font-semibold">
                  Healthy
                </span>
              </div>
            </div>
          </Card>

          {/* Performance Indicators */}
          <Card className="rounded-none p-4 bg-gray-950 border-gray-800 sm:p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MdComputer className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-bold text-white">Performance</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-white font-semibold">
                    {((health.memory.heapUsed / health.memory.heapTotal) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2">
                  <div
                    className="bg-purple-600 h-2 transition-all duration-300"
                    style={{ width: `${(health.memory.heapUsed / health.memory.heapTotal) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Database Size</span>
                  <span className="text-white font-semibold">
                    {((health.database.storageSize / health.database.dataSize) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-300"
                    style={{ width: `${(health.database.storageSize / health.database.dataSize) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemHealth;

