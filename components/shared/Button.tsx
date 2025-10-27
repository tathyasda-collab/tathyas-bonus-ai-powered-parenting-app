
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'gradient' | 'warm' | 'cool' | 'nature';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseClasses = 'rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center transform hover:scale-105 active:scale-95';

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-white/20 backdrop-blur-sm text-gray-800 dark:text-white hover:bg-white/30 focus:ring-gray-400 border border-white/30',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-lg hover:shadow-xl',
    gradient: 'btn-gradient text-white shadow-lg hover:shadow-xl focus:ring-purple-500',
    warm: 'btn-gradient-warm text-white shadow-lg hover:shadow-xl focus:ring-pink-500',
    cool: 'btn-gradient-cool text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
    nature: 'btn-gradient-nature text-white shadow-lg hover:shadow-xl focus:ring-green-500'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          <span className="animate-pulse">Processing...</span>
        </div>
      )}
      {!isLoading && children}
    </button>
  );
};