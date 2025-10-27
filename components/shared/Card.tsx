
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'warm' | 'cool' | 'nature';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  variant = 'default' 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'glass backdrop-blur-xl border border-white/20 text-white';
      case 'gradient':
        return 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 text-white border-0';
      case 'warm':
        return 'bg-gradient-to-br from-pink-500/90 to-red-500/90 text-white border-0';
      case 'cool':
        return 'bg-gradient-to-br from-cyan-500/90 to-blue-500/90 text-white border-0';
      case 'nature':
        return 'bg-gradient-to-br from-green-500/90 to-emerald-500/90 text-white border-0';
      default:
        return 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 shadow-xl';
    }
  };

  return (
    <div className={`${getVariantClasses()} rounded-2xl overflow-hidden card-hover transition-all duration-300 ${className}`}>
      {title && (
        <div className="p-6 border-b border-white/20 dark:border-gray-700/50">
          <h3 className={`text-xl font-bold ${variant === 'default' ? 'text-gradient' : 'text-white'}`}>
            {title}
          </h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full sparkle opacity-0"></div>
      <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/40 rounded-full sparkle opacity-0" style={{animationDelay: '1s'}}></div>
    </div>
  );
};