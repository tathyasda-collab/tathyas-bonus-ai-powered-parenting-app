
import React, { useEffect } from 'react';
import { useError } from '../../context/ErrorContext';

export const ErrorToast: React.FC = () => {
  const { error, clearError } = useError();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 bg-red-600 text-white rounded-lg shadow-lg p-4 max-w-sm flex items-start animate-fade-in-up"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">
        {/* Exclamation Triangle Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="font-bold text-base">An Error Occurred</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
      <button 
        onClick={clearError} 
        className="ml-4 p-1 -mr-1 -mt-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Dismiss"
      >
        {/* Close Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};