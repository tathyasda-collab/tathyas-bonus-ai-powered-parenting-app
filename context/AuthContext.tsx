// context/AuthContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, ApiError } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    needsSetup: boolean;
    isAdminView: boolean;
    isRecoveringPassword: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    completeSetup: () => void;
    toggleAdminView: () => void;
    finishPasswordRecovery: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [isAdminView, setIsAdminView] = useState(false);
    const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

    const checkUserProfile = useCallback(async (userId: string) => {
        try {
            const profile = await api.getUserProfile(userId);
            if (!profile) {
                setNeedsSetup(true);
            } else {
                setNeedsSetup(false);
            }
        } catch (e) {
            // This error is logged by the ApiError class, just handle UI state
            if (e instanceof ApiError) {
                setError(e.userMessage);
            }
            setNeedsSetup(true); // Default to setup if profile check fails
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        let subscriptionHandle: any = null;

        async function initAuth() {
            setLoading(true);
            setError(null);

            try {
                // 1) First check if there is already a session at startup
                let sessionUser: any = null;

                if (api.getSession) {
                    // If api wrapper provides getSession, use it
                    try {
                        const s = await api.getSession();
                        sessionUser = s?.user ?? null;
                    } catch (e) {
                        // fallback to direct supabase call
                        const { data } = await supabase.auth.getSession();
                        sessionUser = data?.session?.user ?? null;
                    }
                } else {
                    const { data } = await supabase.auth.getSession();
                    sessionUser = data?.session?.user ?? null;
                }

                if (!mounted) return;

                console.log('DEBUG AuthContext: initial session present?', !!sessionUser);

                if (sessionUser) {
                    setUser(sessionUser);
                    if (sessionUser.role === 'admin') {
                        setNeedsSetup(false);
                        setIsAdminView(true);
                    } else {
                        setIsAdminView(false);
                        await checkUserProfile(sessionUser.id);
                    }
                } else {
                    setUser(null);
                    setNeedsSetup(false);
                    setIsAdminView(false);
                }

                // 2) Subscribe to auth state changes (use api wrapper if available)
                const callback = async (event: string, payload: any) => {
                    console.log('DEBUG AuthContext: onAuthStateChange event=', event, 'userPresent=', !!payload);
                    if (event === 'PASSWORD_RECOVERY') {
                        setIsRecoveringPassword(true);
                    }

                    const newUser = payload ?? null;
                    setUser(newUser);

                    if (newUser) {
                        if (newUser.role === 'admin') {
                            setNeedsSetup(false);
                            setIsAdminView(true);
                        } else {
                            setIsAdminView(false);
                            await checkUserProfile(newUser.id);
                        }
                    } else {
                        // logged out
                        setNeedsSetup(false);
                        setIsAdminView(false);
                        if (event === 'SIGNED_OUT') {
                            setIsRecoveringPassword(false);
                        }
                    }
                    setLoading(false);
                };

                if (api.onAuthStateChange) {
                    // api wrapper might return { data: { subscription } } or the raw subscription; handle both
                    const maybe = api.onAuthStateChange(callback);
                    // try different shapes
                    try {
                        // supabase-js v2 style: { data: { subscription } }
                        subscriptionHandle = maybe?.data?.subscription ?? maybe?.subscription ?? maybe;
                    } catch {
                        subscriptionHandle = maybe;
                    }
                } else {
                    const maybe = supabase.auth.onAuthStateChange((event, session) => {
                        // session.user may be null on signout
                        const u = session?.user ?? null;
                        callback(event, u);
                    });
                    subscriptionHandle = maybe?.data?.subscription ?? maybe;
                }
            } catch (err) {
                console.error('Failed to initialize authentication listener:', err);
                const message = err instanceof Error ? err.message : 'A critical error occurred during app startup.';
                setError(message);
                setLoading(false);
            }
        }

        initAuth();

        return () => {
            mounted = false;
            try {
                // unsubscribe/cleanup if possible
                if (subscriptionHandle) {
                    // supabase subscription has .unsubscribe()
                    if (typeof subscriptionHandle.unsubscribe === 'function') {
                        subscriptionHandle.unsubscribe();
                    } else if (typeof subscriptionHandle.remove === 'function') {
                        subscriptionHandle.remove();
                    }
                }
            } catch (e) {
                // ignore cleanup errors
            }
        };
    }, [checkUserProfile]);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.login(email, pass);
            // On success, the onAuthStateChange listener handles state updates.
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                console.error('An unexpected error occurred during login:', err);
                setError('An unexpected error occurred. Please try again.');
            }
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await api.logout();
            setUser(null);
            setIsRecoveringPassword(false);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                console.error('An unexpected error occurred during logout:', err);
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const completeSetup = () => {
        setNeedsSetup(false);
    };

    const finishPasswordRecovery = () => {
        setIsRecoveringPassword(false);
    };

    const toggleAdminView = () => {
        if (user?.role === 'admin') {
            setIsAdminView(prev => !prev);
        }
    };

    const value = {
        user,
        loading,
        error,
        needsSetup,
        isAdminView,
        isRecoveringPassword,
        login,
        logout,
        completeSetup,
        toggleAdminView,
        finishPasswordRecovery,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
