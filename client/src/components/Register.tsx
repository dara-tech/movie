import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Film, UserPlus } from 'lucide-react';
import api from '../services/api';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [popularMovies, setPopularMovies] = useState<Array<{ _id?: string; title: string; posterPath?: string }>>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    let isMounted = true;
    setMoviesLoading(true);
    (async () => {
      try {
        const res = await api.get('/api/movies/popular?limit=12');
        const movies = res.data?.movies || res.data?.data?.movies || [];
        if (isMounted) {
          setPopularMovies(movies);
          setMoviesLoading(false);
        }
      } catch (_) {
        if (isMounted) setMoviesLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Visual grid of popular movies (lg only) */}
        <div className="hidden lg:flex">
          <div className="bg-black border border-gray-800 rounded-none p-6 w-full h-full relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]"></div>
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 border border-gray-700">
                    <Film className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-white font-bold text-lg uppercase tracking-wide">Popular Picks</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600"></div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Live</span>
                </div>
              </div>
              <div className="grid grid-cols-3 grid-rows-3 gap-2 flex-1">
                {moviesLoading ? (
                  Array.from({ length: 9 }).map((_, idx) => (
                    <div key={`skeleton-${idx}`} className="relative overflow-hidden border border-gray-900 bg-gray-950">
                      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-950 animate-pulse"></div>
                    </div>
                  ))
                ) : (
                  <>
                    {popularMovies.slice(0, 9).map((m, idx) => (
                      <div key={(m._id || m.title || 'movie') + idx} className="group relative overflow-hidden border border-gray-900 bg-gray-950 hover:border-gray-800 transition-all duration-200">
                        <img
                          src={m.posterPath ? `https://image.tmdb.org/t/p/w300${m.posterPath}` : '/placeholder-movie.jpg'}
                          alt={m.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-movie.jpg'; }}
                        />
                        {/* Hover overlay with title */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-2 w-full">
                            <div className="text-[10px] font-bold text-white uppercase tracking-wide line-clamp-2">{m.title}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {popularMovies.length === 0 && (
                      <div className="col-span-3 row-span-3 flex items-center justify-center text-sm text-gray-600 uppercase tracking-wide">No items to display</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Auth card */}
        <div className="w-full max-w-md mx-auto flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-red-600 border border-gray-700 flex items-center justify-center">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
              MovieStream
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-red-600"></div>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Your Gateway to Entertainment</p>
            <div className="w-1 h-1 bg-red-600"></div>
          </div>
        </div>

        <Card className="w-full bg-black border border-gray-800 rounded-none">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Join MovieStream and start watching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 rounded-none border border-red-900/50 text-red-400 text-sm bg-red-950/30">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-gray-300 font-bold text-sm uppercase tracking-wide">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-gray-950 border border-gray-800 text-white placeholder-gray-600 h-12 text-base rounded-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-300 font-bold text-sm uppercase tracking-wide">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-gray-950 border border-gray-800 text-white placeholder-gray-600 h-12 text-base rounded-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-300 font-bold text-sm uppercase tracking-wide">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-gray-950 border border-gray-800 text-white placeholder-gray-600 h-12 text-base rounded-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-bold text-sm uppercase tracking-wide">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-gray-950 border border-gray-800 text-white placeholder-gray-600 h-12 text-base rounded-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-base uppercase tracking-wider rounded-none transition-all duration-200" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                  </div>
                )}
              </Button>
              
              <div className="text-center text-sm pt-4">
                <span className="text-gray-400">Already have an account? </span>
                <Link 
                  to="/login" 
                  className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 MovieStream. All rights reserved.</p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
