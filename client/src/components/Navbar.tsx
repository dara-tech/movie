import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  LogOut,
  ChevronDown,
  Shield,
  Menu,
  X,
  Search,
} from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Movies', path: '/movies' },
    { label: 'TV Shows', path: '/tvshows' },
    { label: 'Watchlist', path: '/watchlist' },
    { label: 'History', path: '/history' },
  ];

  const categoryItems = [
    { label: 'Trending', path: '/movies?category=trending' },
    { label: 'Popular', path: '/movies?category=popular' },
    { label: 'Top Rated', path: '/movies?category=top-rated' },
    { label: 'Action', path: '/movies?category=action' },
    { label: 'Comedy', path: '/movies?category=comedy' },
    { label: 'Drama', path: '/movies?category=drama' },
    { label: 'Horror', path: '/movies?category=horror' },
    { label: 'Romance', path: '/movies?category=romance' },
  ];

  const tvShowCategoryItems = [
    { label: 'Trending', path: '/tvshows?category=trending' },
    { label: 'Popular', path: '/tvshows?category=popular' },
    { label: 'Top Rated', path: '/tvshows?category=top-rated' },
    { label: 'Drama', path: '/tvshows?category=drama' },
    { label: 'Comedy', path: '/tvshows?category=comedy' },
    { label: 'Animation', path: '/tvshows?category=animation' },
    { label: 'Action & Adventure', path: '/tvshows?category=action-adventure' },
    { label: 'Sci-Fi & Fantasy', path: '/tvshows?category=sci-fi-fantasy' },
  ];

  const handleCategoryClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md border-b border-white/10' 
        : 'bg-black/90 backdrop-blur-sm border-b border-white/5'
    }`}>
      <div className=" flex h-20 items-center px-6">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer select-none" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="text-3xl font-black tracking-tight">
            <span className="text-white">MOVIE</span>
            <span className="text-red-600">STREAM</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 ml-12">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                relative px-5 py-2 text-sm font-medium uppercase tracking-wider
                transition-all duration-300 ease-out h-10 flex items-center
                ${isActive(item.path)
                  ? 'text-red-600'
                  : 'text-gray-400 hover:text-red-600'
                }
                group
              `}
            >
              <span className="relative z-10">{item.label}</span>
              {/* Active indicator line */}
              {isActive(item.path) && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 transition-all duration-300" />
              )}
              {/* Hover indicator line */}
              <span className={`absolute bottom-0 left-0 w-0 h-[1px] bg-red-600/40 transition-all duration-300 group-hover:w-full ${isActive(item.path) ? 'hidden' : ''}`} />
            </button>
          ))}
        </div>

        {/* Categories Dropdown */}
        <div className="hidden lg:block ml-1">
          <DropdownMenu open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
            <DropdownMenuTrigger asChild>
              <button className={`relative px-5 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 group h-10 flex items-center ${
                isCategoriesOpen ? 'text-red-600' : 'text-gray-400 hover:text-red-600'
              }`}>
                <span className="relative z-10 flex items-center gap-2">
                  Categories
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                </span>
                {/* Active indicator line */}
                {isCategoriesOpen && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 transition-all duration-300" />
                )}
                {/* Hover indicator line */}
                <span className={`absolute bottom-0 left-0 w-0 h-[1px] bg-red-600/40 transition-all duration-300 group-hover:w-full ${isCategoriesOpen ? 'hidden' : ''}`} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-[520px] bg-gray-950 backdrop-blur-2xl border border-white/30 rounded-none p-0 shadow-2xl" 
              align="start"
              sideOffset={0}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/10">
                <h3 className="text-base font-semibold text-white uppercase tracking-wider">
                  Browse Categories
                </h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
                  Movies & TV Shows
                </p>
              </div>
              
              {/* Content */}
              <div className="px-6 py-5 max-h-[480px] overflow-y-auto">
                {/* Movies Section */}
                <div className="mb-8 last:mb-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-4">
                    Movies
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryItems.map((item, index) => (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => {
                          handleCategoryClick(item.path);
                          setIsCategoriesOpen(false);
                        }}
                        className="group relative text-gray-400 hover:text-red-600 transition-all duration-300 cursor-pointer px-4 py-3 rounded-sm border border-transparent hover:border-red-600/20 hover:bg-red-600/5 focus:outline-none"
                      >
                        <span className="text-sm font-medium tracking-wide relative z-10">
                          {item.label}
                        </span>
                        {/* Hover accent */}
                        <span className="absolute left-0 top-0 bottom-0 w-0 bg-red-600 group-hover:w-[3px] transition-all duration-300" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>

                {/* TV Shows Section */}
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-4">
                    TV Shows
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tvShowCategoryItems.map((item, index) => (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => {
                          handleCategoryClick(item.path);
                          setIsCategoriesOpen(false);
                        }}
                        className="group relative text-gray-400 hover:text-red-600 transition-all duration-300 cursor-pointer px-4 py-3 rounded-sm border border-transparent hover:border-red-600/20 hover:bg-red-600/5 focus:outline-none"
                      >
                        <span className="text-sm font-medium tracking-wide relative z-10">
                          {item.label}
                        </span>
                        {/* Hover accent */}
                        <span className="absolute left-0 top-0 bottom-0 w-0 bg-red-600 group-hover:w-[3px] transition-all duration-300" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Search */}
          <button
            onClick={() => navigate('/search')}
            className={`relative px-5 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 group h-10 flex items-center ${
              isActive('/search') ? 'text-red-600' : 'text-gray-400 hover:text-red-600'
            }`}
          >
            <span className="relative z-10">
              <Search className="w-5 h-5" />
            </span>
            {/* Active indicator line */}
            {isActive('/search') && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 transition-all duration-300" />
            )}
            {/* Hover indicator line */}
            <span className={`absolute bottom-0 left-0 w-0 h-[1px] bg-red-600/40 transition-all duration-300 group-hover:w-full ${isActive('/search') ? 'hidden' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 w-9 rounded-full p-0 border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                <Avatar className="h-full w-full">
                  <AvatarFallback className="bg-white text-black font-bold text-sm border-0">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-64 bg-gray-950 backdrop-blur-2xl border border-white/30 rounded-none shadow-2xl" 
              align="end"
              forceMount
            >
              <div className="px-4 py-4 border-b border-white/10">
                <p className="text-sm font-semibold text-white">{user?.username}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user?.email}
                </p>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin')}
                    className="text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer py-3 my-1"
                  >
                    <Shield className="mr-3 h-4 w-4" />
                    <span className="text-sm uppercase tracking-wide">Admin Panel</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                </>
              )}
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 cursor-pointer py-3"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-sm uppercase tracking-wide">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors duration-300"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/30 bg-gray-950 backdrop-blur-2xl shadow-2xl">
          <div className="px-6 py-6 space-y-6">
            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    block w-full text-left px-4 py-3 text-sm font-medium uppercase tracking-wider
                    transition-all duration-300 rounded-sm border
                    ${isActive(item.path)
                      ? 'text-red-600 border-red-600/20 bg-red-600/5'
                      : 'text-gray-400 border-transparent hover:text-red-600 hover:border-red-600/10 hover:bg-red-600/5'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Categories */}
            <div className="space-y-4">
              {/* Movies */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3 px-4">
                  Movies
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categoryItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        handleCategoryClick(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-3 text-sm text-gray-400 hover:text-red-600 hover:bg-red-600/5 border border-white/10 rounded-sm transition-all duration-300 uppercase tracking-wider"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TV Shows */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3 px-4">
                  TV Shows
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {tvShowCategoryItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        handleCategoryClick(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-3 text-sm text-gray-400 hover:text-red-600 hover:bg-red-600/5 border border-white/10 rounded-sm transition-all duration-300 uppercase tracking-wider"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
