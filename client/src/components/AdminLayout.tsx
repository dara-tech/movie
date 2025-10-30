import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminUserManagement from './AdminUserManagement';
import AdminContentManagement from './AdminContentManagement';
import AdminGenreManagement from './AdminGenreManagement';
import AdminStreamingManagement from './AdminStreamingManagement';
import AdminSyncManagement from './AdminSyncManagement';
import AdminSystemHealth from './AdminSystemHealth';
import AutoSyncPanel from './AutoSyncPanel';
import ComingSoon from './admin/ComingSoon';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, Activity, Ban, BarChart3, Database, FileText, Lock, Key, Clock } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loading while checking auth
  if (loading) {
    return (
      <LoadingSpinner fullScreen text="Loading..." color="blue" size="xl" />
    );
  }

  // Check if user has admin access
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access the admin panel.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
     

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/users" element={<AdminUserManagement />} />
            <Route path="/users/roles" element={<ComingSoon title="User Roles Management" description="Manage user roles and permissions" icon={<Users className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/users/activity" element={<ComingSoon title="User Activity" description="Track user activity and engagement" icon={<Activity className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/users/banned" element={<ComingSoon title="Banned Users" description="Manage banned and restricted users" icon={<Ban className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/content/movies" element={<AdminContentManagement contentType="movies" />} />
            <Route path="/content/tvshows" element={<AdminContentManagement contentType="tvshows" />} />
            <Route path="/content/genres" element={<AdminGenreManagement />} />
            <Route path="/content/streaming" element={<AdminStreamingManagement />} />
            <Route path="/content/sync" element={<AdminSyncManagement />} />
            <Route path="/analytics/users" element={<ComingSoon title="User Analytics" description="Detailed user engagement analytics" icon={<BarChart3 className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/analytics/content" element={<ComingSoon title="Content Analytics" description="Content performance and statistics" icon={<BarChart3 className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/analytics/system" element={<ComingSoon title="System Analytics" description="System performance metrics" icon={<BarChart3 className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/analytics/reports" element={<ComingSoon title="Custom Reports" description="Generate and export custom reports" icon={<FileText className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/ai/conversations" element={<ComingSoon title="AI Conversations" description="AI assistant conversations log" />} />
            <Route path="/ai/memory" element={<ComingSoon title="AI Memory Bank" description="Manage AI knowledge base" />} />
            <Route path="/ai/tasks" element={<ComingSoon title="AI Tasks" description="AI automated tasks" />} />
            <Route path="/ai/settings" element={<ComingSoon title="AI Settings" description="Configure AI features" />} />
            <Route path="/system/health" element={<AdminSystemHealth />} />
            <Route path="/system/database" element={<ComingSoon title="Database Management" description="Manage database collections and documents" icon={<Database className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/system/logs" element={<ComingSoon title="System Logs" description="View system activity logs" icon={<FileText className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/system/backups" element={<ComingSoon title="System Backups" description="Create and restore system backups" icon={<Database className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/system/autosync" element={<AutoSyncPanel />} />
            <Route path="/security/access" element={<ComingSoon title="Access Control" description="Manage user access permissions" icon={<Lock className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/security/apikeys" element={<ComingSoon title="API Keys" description="Manage API keys and tokens" icon={<Key className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/security/audit" element={<ComingSoon title="Audit Logs" description="Security and access audit trail" icon={<FileText className="h-20 w-20 text-gray-400" />} />} />
            <Route path="/security/sessions" element={<ComingSoon title="Active Sessions" description="Manage active user sessions" icon={<Clock className="h-20 w-20 text-gray-400" />} />} />
            <Route path="*" element={<div className="p-6 text-white text-center">Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
