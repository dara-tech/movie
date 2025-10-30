import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, description = "This feature is coming soon!", icon }) => {
  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          {icon || <Construction className="h-20 w-20 text-gray-400" />}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {title}
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          {description}
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-500">
            We're working hard to bring you this feature. Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

