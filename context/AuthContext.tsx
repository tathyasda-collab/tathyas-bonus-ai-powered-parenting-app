
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { User, UserProfile } from '../types';
import * as api from '../services/api';
import { Loader } from '../components/shared/Loader';
// Fix: Import getSupabase directly from its source file.
import { getSupabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsSetup: boolean;
  needsProfileSetup: boolean;
  isAdminView: boolean;
  isRecoveringPassword: boolean;
  subscriptionExpired: boolean;
  renewalUrl: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [renewalUrl, setRenewalUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check if we're in password recovery mode
        const urlParams = new URLSearchParams(window.location.search);
        const isPasswordRecovery = window.location.pathname === '/reset-password' || 
                                  urlParams.has('type') && urlParams.get('type') === 'recovery';
        
        if (isPasswordRecovery) {
          setIsRecoveringPassword(true);
          setLoading(false);
          return;
        }

        // Check for custom session first
        const customSession = localStorage.getItem('user_session');
        if (customSession) {
          const userData = JSON.parse(customSession);
          if (userData.authenticated) {
            setUser(userData);
            setNeedsProfileSetup(userData.needsProfileSetup || false);
            await fetchProfileFromAuthUsers(userData);
            setLoading(false);
            return;
          }
        }

        // If no custom session, clear any stale data
        setUser(null);
        setProfile(null);
        setNeedsSetup(false);
        setNeedsProfileSetup(false);
        setSubscriptionExpired(false);
        setRenewalUrl(null);
      } catch (e: any) {
        console.error('Auth check error:', e);
        setError(e.message);
        // Clear invalid session data
        localStorage.removeItem('user_session');
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async (currentUser: User) => {
        const userProfile = await api.getUserProfile(currentUser.id);
        setProfile(userProfile);
        // A profile is incomplete if full_name is missing.
        setNeedsSetup(!userProfile?.full_name);
    };

    const fetchProfileFromAuthUsers = async (userData: any) => {
        try {
          // For custom auth users, create a profile object from auth_users data
          const userProfile: UserProfile = {
              id: userData.id,
              email: userData.email,
              role: userData.role || 'user',
              full_name: userData.full_name || '',
              created_at: userData.created_at || new Date().toISOString(),
          };
          setProfile(userProfile);
          // Respect the API's determination of whether profile setup is needed
          setNeedsSetup(userData.needsProfileSetup || false);
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
          setNeedsSetup(true);
        }
    };

    checkUser();

    // Listen for custom auth changes
    const handleCustomAuthChange = (event: CustomEvent) => {
      const { user: userData, authenticated } = event.detail;
      
      if (authenticated) {
        setUser(userData);
        setNeedsProfileSetup(userData.needsProfileSetup || false);
        setSubscriptionExpired(false);
        setRenewalUrl(null);
        fetchProfileFromAuthUsers(userData);
      } else {
        setUser(null);
        setProfile(null);
        setNeedsSetup(false);
        setNeedsProfileSetup(false);
        setSubscriptionExpired(false);
        setRenewalUrl(null);
      }
      setLoading(false);
    };

    // Listen for subscription expiry events
    const handleSubscriptionExpiry = (event: CustomEvent) => {
      const { renewalUrl: url } = event.detail;
      setSubscriptionExpired(true);
      setRenewalUrl(url);
    };

    window.addEventListener('auth-change', handleCustomAuthChange as EventListener);
    window.addEventListener('subscription-expired', handleSubscriptionExpiry as EventListener);

    return () => {
      window.removeEventListener('auth-change', handleCustomAuthChange as EventListener);
      window.removeEventListener('subscription-expired', handleSubscriptionExpiry as EventListener);
    };
  }, []);
  
  const isAdminView = profile?.role === 'admin' || 
                      (user as any)?.role === 'admin' || 
                      (user as any)?.status === 'admin';

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    error,
    needsSetup,
    needsProfileSetup,
    isAdminView,
    isRecoveringPassword,
    subscriptionExpired,
    renewalUrl
  }), [user, profile, loading, error, needsSetup, needsProfileSetup, isAdminView, isRecoveringPassword, subscriptionExpired, renewalUrl]);

  // Render a full-page loader while the initial auth state is being determined.
  if (loading && !user && !isRecoveringPassword) {
      return <div className="h-screen w-screen flex items-center justify-center"><Loader /></div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};