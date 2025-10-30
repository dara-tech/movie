import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'red' | 'blue' | 'white';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'red', 
  text,
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    default: 'text-gray-400',
    red: 'text-red-500',
    blue: 'text-blue-500',
    white: 'text-white'
  };

  const textColorClasses = {
    default: 'text-gray-400',
    red: 'text-red-500',
    blue: 'text-blue-500',
    white: 'text-white'
  };

  const spinner = (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-center">
          <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin rounded-full border-2 border-current border-t-transparent mx-auto`} />
          {text && (
            <p className={`mt-4 text-lg ${textColorClasses[color]}`}>{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin rounded-full border-2 border-current border-t-transparent`} />
      {text && (
        <p className={`mt-2 text-sm ${textColorClasses[color]}`}>{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
