
import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number; // 0-100
  type?: 'spinner' | 'pulse' | 'bounce';
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  message, 
  progress,
  type = 'spinner' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const renderSpinner = () => (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`}></div>
  );

  const renderPulse = () => (
    <div className={`animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-600 ${sizeClasses[size]}`}></div>
  );

  const renderBounce = () => (
    <div className="flex space-x-1">
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"></div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-3">
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress || 0}%` }}
      ></div>
    </div>
  );

  return (
    <div className="flex flex-col justify-center items-center p-6">
      {/* Main Loader */}
      <div className="relative">
        {type === 'spinner' && renderSpinner()}
        {type === 'pulse' && renderPulse()}
        {type === 'bounce' && renderBounce()}
        
        {/* Magic sparkle effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping [animation-delay:0.5s]"></div>
        </div>
      </div>

      {/* Progress Bar */}
      {typeof progress === 'number' && (
        <div className="w-64 mt-4">
          {renderProgressBar()}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
            {progress}%
          </div>
        </div>
      )}

      {/* Loading Message */}
      {message && (
        <div className="mt-4 text-center">
          <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {message}
          </p>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0s]"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};