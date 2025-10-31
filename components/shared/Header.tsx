
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../services/api';
import type { UserDaysRemaining } from '../../types';
import { LOGO_URL, APP_NAME } from '../../constants';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('Header user object:', user);
      console.log('Header user.id:', user.id);
      
      api.getUserProfile(user.id).then((profile) => {
        console.log('Header received profile:', profile);
        setFullProfile(profile);
      });
      
      // Get subscription info for header display
      if (user.email) {
        api.getUserSubscriptionInfo(user.email).then((subInfo) => {
          console.log('Header subscription info:', subInfo);
          setSubscriptionInfo(subInfo);
          
          // Show renewal dialog if needed
          if (subInfo?.renewal_needed) {
            setShowRenewalDialog(true);
          }
        });
      }
    }
  }, [user]);

  const displayName = fullProfile?.full_name || profile?.full_name || user?.email?.split('@')[0] || 'User';
  console.log('Header displayName logic:', { 
    fullProfile_full_name: fullProfile?.full_name, 
    profile_full_name: profile?.full_name, 
    user_email_split: user?.email?.split('@')[0], 
    final_displayName: displayName 
  });

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-700 dark:from-gray-800 dark:to-gray-900 shadow-lg border-b border-white/10">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and App Name */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={LOGO_URL} alt="App Logo" className="h-10 w-10 rounded-lg shadow-md" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>

          {/* Right side - User info, subscription info, theme toggle, logout */}
          {user && (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User name - hidden on very small screens */}
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-white">
                  {displayName}
                </span>
              </div>

              {/* Subscription Days Remaining */}
              {subscriptionInfo && (
                <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm border ${
                  subscriptionInfo.days_remaining <= 3 
                    ? 'bg-red-500/20 border-red-300/30 text-red-200' 
                    : subscriptionInfo.days_remaining <= 7 
                    ? 'bg-yellow-500/20 border-yellow-300/30 text-yellow-200' 
                    : 'bg-green-500/20 border-green-300/30 text-green-200'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {subscriptionInfo.status === 'renewed'
                      ? 'Renewed'
                      : subscriptionInfo.status === 'expired'
                      ? 'Expired'
                      : subscriptionInfo.days_remaining !== null
                      ? `${subscriptionInfo.days_remaining} days left`
                      : 'Active'
                    }
                  </span>
                </div>
              )}

              {/* Theme toggle button */}
              <button 
                onClick={toggleTheme} 
                className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 text-white/80 hover:text-white backdrop-blur-sm border border-white/20 group"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>

              {/* Logout button */}
              <Button 
                onClick={handleLogout} 
                className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/30 hover:border-red-300/50 backdrop-blur-sm text-sm px-3 py-2 sm:px-4 sm:py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Renewal Reminder Dialog */}
      {showRenewalDialog && subscriptionInfo?.renewal_needed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Subscription Expiring Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your subscription expires in {subscriptionInfo.days_remaining} days. 
                  Renew now to continue enjoying all features without interruption.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.open(subscriptionInfo.renewal_url, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Renew Now
                  </Button>
                  <Button
                    onClick={() => setShowRenewalDialog(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                  >
                    Remind Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};