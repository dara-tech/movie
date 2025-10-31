import React from 'react';
import { Button } from './ui/button';

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface StreamingProviderFilterProps {
  providers: WatchProvider[];
  selectedProvider: number | null;
  onProviderToggle: (providerId: number | null) => void;
  className?: string;
}

const StreamingProviderFilter: React.FC<StreamingProviderFilterProps> = ({
  providers,
  selectedProvider,
  onProviderToggle,
  className = ""
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* All/None option */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onProviderToggle(null)}
          className={`
            transition-all duration-200 text-sm px-3 py-1.5 rounded-full
            ${!selectedProvider
              ? "bg-white text-black border-white hover:bg-gray-200 font-semibold"
              : "bg-transparent border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-800/50"
            }
          `}
          title="All Services"
        >
          All
        </Button>
      
      {/* Provider buttons */}
      {providers.map((provider) => {
        const isSelected = selectedProvider === provider.provider_id;
        return (
          <Button
            key={provider.provider_id}
            variant="outline"
            size="sm"
            onClick={() => onProviderToggle(isSelected ? null : provider.provider_id)}
            className={`
              transition-all duration-200 text-sm p-2 rounded-full flex items-center justify-center
              ${isSelected
                ? "bg-white text-black border-white hover:bg-gray-200 font-semibold"
                : "bg-transparent border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white hover:bg-gray-800/50"
              }
            `}
            title={provider.provider_name}
          >
            {provider.logo_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                alt={provider.provider_name}
                className="w-5 h-5 object-contain rounded-full"
                title={provider.provider_name}
                onError={(e) => {
                  // Hide button if logo fails to load
                  (e.target as HTMLImageElement).parentElement?.parentElement?.classList.add('hidden');
                }}
              />
            ) : (
              <span className="text-xs">{provider.provider_name.substring(0, 2).toUpperCase()}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default StreamingProviderFilter;

