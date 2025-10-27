
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../services/api';
import type { UserDaysRemaining } from '../../types';
import { Header } from '../shared/Header';
import { DashboardHome } from './DashboardHome';
import AdminDashboard from './AdminDashboard';
import { ParentingPlanner } from '../tools/ParentingPlanner';
import { MealAssistant } from '../tools/MealAssistant';
import { EmotionCheckin } from '../tools/EmotionCheckin';

type ActiveView = 'home' | 'planner' | 'meal' | 'emotion';

export const UserDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [daysRemaining, setDaysRemaining] = useState<UserDaysRemaining | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      api.getUserDaysRemaining().then(setDaysRemaining);
      // Fetch complete user profile to check admin status (fallback if session doesn't have role)
      if (!(user as any).role && !(user as any).status) {
        api.getUserProfile(user.id).then((profile) => {
          setUserProfile(profile);
        });
      }
    }
  }, [user]);

  // Check if user is admin - first check session role/status, then fallback to profile
  const isAdmin = (user as any)?.role === 'admin' || 
                   (user as any)?.status === 'admin' || 
                   userProfile?.role === 'admin' ||
                   userProfile?.status === 'admin';

  // Redirect to admin dashboard if user is admin
  if (isAdmin) {
    return <AdminDashboard />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'planner':
        return <ParentingPlanner />;
      case 'meal':
        return <MealAssistant />;
      case 'emotion':
        return <EmotionCheckin />;
      case 'home':
      default:
        return <DashboardHome setActiveView={setActiveView} />;
    }
  };

  const SubscriptionAlert = () => {
    if (!daysRemaining || daysRemaining.days_remaining > 7) return null;
    
    const isExpired = !daysRemaining.is_active;
    const alertClass = isExpired ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200' : 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200';
    
    return (
      <div className={`border-l-4 p-4 ${alertClass}`} role="alert">
        <p className="font-bold">{isExpired ? 'Subscription Expired' : 'Subscription Notice'}</p>
        <p>
          {isExpired ? 'Your access has expired.' : `Your subscription expires in ${daysRemaining.days_remaining} days.`}
          {daysRemaining.renewal_link && (
            <a href={daysRemaining.renewal_link} target="_blank" rel="noopener noreferrer" className="font-bold underline ml-2">
              {isExpired ? 'Renew Now' : 'Renew'}
            </a>
          )}
        </p>
      </div>
    );
  };


  return (
    <div className={`min-h-screen text-white ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' : 'gradient-bg'}`}>
      <Header />
      
      <main className="flex justify-center px-4 py-6 mt-20">
        <div className="w-full max-w-4xl space-y-6">
          <SubscriptionAlert />
          {activeView !== 'home' && (
             <button 
               onClick={() => setActiveView('home')} 
               className="text-white/90 hover:text-white hover:underline mb-4 flex items-center space-x-2 transition-all duration-200"
             >
               <span>←</span>
               <span>Back to Dashboard</span>
             </button>
          )}
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
};