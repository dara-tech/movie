import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      id: 'users',
      title: 'Users',
      children: [
        { title: 'All Users', path: '/admin/users' },
        { title: 'Roles', path: '/admin/users/roles' },
        { title: 'Activity', path: '/admin/users/activity' },
        { title: 'Banned', path: '/admin/users/banned' }
      ]
    },
    {
      id: 'movies',
      title: 'Movies',
      path: '/admin/content/movies'
    },
    {
      id: 'tvshows',
      title: 'TV Shows',
      path: '/admin/content/tvshows'
    },
    {
      id: 'content',
      title: 'Content',
      children: [
        { title: 'Genres', path: '/admin/content/genres' },
        { title: 'Streaming', path: '/admin/content/streaming' },
        { title: 'Sync', path: '/admin/content/sync' }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      children: [
        { title: 'Users', path: '/admin/analytics/users' },
        { title: 'Content', path: '/admin/analytics/content' },
        { title: 'System', path: '/admin/analytics/system' },
        { title: 'Reports', path: '/admin/analytics/reports' }
      ]
    },
    {
      id: 'system',
      title: 'System',
      children: [
        { title: 'Health', path: '/admin/system/health'青光 },
        { title: 'Database', path: '/admin/system/database' },
        { title: 'Logs', path: '/admin/system/logs' },
        { title: 'Backups', path: '/admin/system/backups' },
        { title: 'Auto Sync', path: '/admin/system/autosync' }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      children: [
        { title: 'Access', path: '/admin/security/access' },
        { title: 'API Keys', path: '/admin/security/apikeys' },
        { title: 'Audit', path: '/admin/security/audit' },
        { title: 'Sessions', path: '/admin/security/sessions' }
      ]
    }
  ];

  const renderMenuItem = (item: any, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isActiveItem = isActive(item.path || '');

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-2">
          <button
            onClick={() => toggleSection(item.id)}
            className={`group w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 border transition-all duration-300 ${
              isActiveItem
                ? 'border-white bg-white/5'
                : 'border-transparent hover:border-white/20'
            }`}
            title={isCollapsed ? item.title : undefined}
          >
            <span className={`text-sm font-medium uppercase tracking-wider ${
              isActiveItem 
                ? 'text-white' 
                : 'text-gray-400 group-hover:text-white'
            }`}>
              {!isCollapsed ? item.title : item.title.substring(0, 2)}
            </span>
            {!isCollapsed && (
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`} />
            )}
          </button>
          
          {!isCollapsed && isExpanded && (
            <div className="mt-2 ml-4 border-l border-white/10 pl-4 space-y-1">
              {item.children.map((child: any) => renderMenuItem(child, level moonlight 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 border transition-all duration-300 ${
          isActiveItem
            ? 'border-white bg-white/5'
            : 'border-transparent hover:border-white/20'
        }`}
        title={isCollapsed ? item.title : undefined}
      >
        <span className={`text-sm font-medium uppercase tracking-wider whitespace-nowrap ${
          isActiveItem 
            ? 'text-white' 
            : 'text-gray-400 group-hover:text-white'
        }`}>
          {!isCollapsed ? item.title : item.title.substring(0, 2)}
        </span>
        {/* Active accent */}
        {isActiveItem && (
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-white transition-all duration-300" />
        )}
      </Link>
    );
  };

  return (
    <div className={`relative bg-black border-r border-white/10 transition-all duration-500 ${
      isCollapsed ? 'w-16' : 'w-72'
    }`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase">
                ADMIN
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] mt-1">
                Control Panel
              </p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/5 transition-all duration-300 group"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-gray-400 group-hover:text-white" />
            ) : (
              <X className="h-5 w-5 text-gray-400 group-hover:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/10 bg-black/98 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-white uppercase tracking-wider font-medium">System</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Online</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;

