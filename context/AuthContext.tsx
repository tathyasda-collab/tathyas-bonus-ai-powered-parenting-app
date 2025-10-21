import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, ApiError } from '../services/api';
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
        setLoading(true);
        setError(null);
        
        try {
            const subscription = api.onAuthStateChange(async (event, user) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setIsRecoveringPassword(true);
                }
                setUser(user);
                if (user) {
                    if (user.role === 'admin') {
                        setNeedsSetup(false);
                        setIsAdminView(true);
                    } else {
                        setIsAdminView(false);
                        await checkUserProfile(user.id);
                    }
                } else {
                    setNeedsSetup(false);
                    setIsAdminView(false); // Reset admin view on logout
                    if (event === 'SIGNED_OUT') {
                        setIsRecoveringPassword(false);
                    }
                }
                setLoading(false);
            });

            return () => {
                subscription?.unsubscribe();
            };
        } catch (err) {
            console.error("Failed to initialize authentication listener:", err);
            const message = err instanceof Error ? err.message : "A critical error occurred during app startup.";
            setError(message);
            setLoading(false);
        }
    }, [checkUserProfile]);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.login(email, pass);
            // On success, the onAuthStateChange listener now handles all state updates:
            // setting the user, checking the profile, and setting loading to false.
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.userMessage);
            } else {
                console.error("An unexpected error occurred during login:", err);
                setError("An unexpected error occurred. Please try again.");
            }
            // On failure, we must manually stop the loading state.
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
                console.error("An unexpected error occurred during logout:", err);
                setError("An unexpected error occurred. Please try again.");
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