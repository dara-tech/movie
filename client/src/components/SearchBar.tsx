import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search movies...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        setIsSearching(true);
        onSearch(query.trim());
        setIsSearching(false);
      } else {
        onSearch('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className={`relative border transition-all duration-300 ${
        isFocused 
          ? 'border-white' 
          : 'border-white/20'
      }`}>
        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder.toUpperCase()}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-6 pr-12 h-14 bg-transparent text-white placeholder-gray-500  text-sm font-medium uppercase tracking-wider"
        />
        
        {/* Bottom border accent on focus */}
        <div className={`absolute bottom-0 left-0 w-0 h-[2px] bg-white transition-all duration-300 ${
          isFocused ? 'w-full' : ''
        }`} />
        
        {/* Right side - Clear button or Loading */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
          {isSearching ? (
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="flex gap-0.5 items-center">
                <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Searching</span>
            </div>
          ) : query ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-white/10 transition-all duration-300 group"
            >
              <X className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
            </Button>
          ) : null}
        </div>
      </div>
      
      {/* Character count indicator */}
      {query && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 uppercase tracking-widest font-medium">
          {query.length} Characters
        </div>
      )}
    </div>
  );
};

export default SearchBar;
