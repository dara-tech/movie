import React from 'react';
import { Button } from './ui/button';
// import { Badge } from './ui/badge';

interface Genre {
  _id: string;
  name: string;
}

interface GenreFilterProps {
  genres: Genre[];
  selectedGenres: string[];
  onGenreToggle: (genreId: string) => void;
  className?: string;
}

const GenreFilter: React.FC<GenreFilterProps> = ({
  genres,
  selectedGenres,
  onGenreToggle,
  className = ""
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {genres.slice(0, 12).map((genre) => {
        const isSelected = selectedGenres.includes(genre._id);
        return (
          <Button
            key={genre._id}
            variant="outline"
            size="sm"
            onClick={() => onGenreToggle(genre._id)}
            className={`
              transition-all duration-200 text-sm px-3 py-1.5 rounded-full
              ${isSelected
                ? "bg-white text-black border-white hover:bg-gray-200 font-semibold"
                : "bg-transparent border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
          >
            {genre.name}
          </Button>
        );
      })}
    </div>
  );
};

export default GenreFilter;
