import { getSupabase } from './supabaseClient';
import type { User, UserProfile, Child, PlannerRun, MealPlanRun, EmotionLog, UserDaysRemaining } from '../types';
import type { AuthChangeEvent, AuthUser, Subscription, UserResponse } from '@supabase/supabase-js';

/**
 * Custom error class for API-related failures.
 * This standardizes error handling by providing a user-friendly message
 * and logging the original technical error for debugging purposes.
 */
export class ApiError extends Error {
    public readonly userMessage: string;
    public readonly originalError?: any;

    constructor(userMessage: string, originalError?: any) {
        // Use the original error's message for the stack trace if available
        const internalMessage = originalError instanceof Error ? originalError.message : String(originalError);
        super(internalMessage);

        this.name = 'ApiError';
        this.userMessage = userMessage;
        this.originalError = originalError;
        
        // Automatically log the error when it's created
        this.log();
    }

    private log() {
        console.error(`[API Error] User Message: "${this.userMessage}"`, {
            originalError: this.originalError,
            stack: this.stack
        });
    }
}

// Helper to combine Supabase auth user and our custom app_users table data
const formatUser = (authUser: AuthUser, userDetails: any): User => {
    if (!userDetails) {
         return {
            id: authUser.id,
            email: authUser.email || '',
            role: 'user',
            status: 'expired',
            subscription_expiry: new Date().toISOString(),
        };
    }
    return {
        id: authUser.id,
        email: authUser.email || '',
        role: userDetails.role ?? 'user',
        status: userDetails.status ?? 'expired',
        subscription_expiry: userDetails.subscription_expiry_date,
        subscription_renewed: userDetails.subscription_renewed,
        subscription_renewal_date: userDetails.subscription_renewal_date,
    };
};

const RLS_HINT = "This may be due to missing or misconfigured Row Level Security (RLS) policies in your Supabase project.";

export const api = {
    // AUTH
    login: async (email: string, pass: string): Promise<void> => {
        const { error: authError } = await getSupabase().auth.signInWithPassword({ email, password: pass });
        if (authError) {
            if (authError.message.includes("Email not confirmed")) {
                throw new ApiError("Your email is not confirmed. Please check your inbox for a confirmation link.", authError);
            }
            throw new ApiError("Login failed. Please check your email and password.", authError);
        }
        // On success, the onAuthStateChange listener will handle fetching/creating the user profile.
    },

    logout: async (): Promise<void> => {
        const { error } = await getSupabase().auth.signOut();
        if (error) throw new ApiError("Logout failed. Please try again.", error);
    },

    forgotPassword: async (email: string): Promise<void> => {
        const { error } = await getSupabase().auth.resetPasswordForEmail(email);
        if (error) throw new ApiError("Password reset request failed. Please check the email address and try again.", error);
    },

    onAuthStateChange: (callback: (event: AuthChangeEvent, user: User | null) => void): Subscription => {
        // Fix: Updated to handle the return signature of supabase-js v2, which does not return an error property on success.
        // Errors are now thrown on initialization failure, so the explicit error check is removed.
        const { data } = getSupabase().auth.onAuthStateChange(async (event, session) => {
            try {
                if (!session?.user) {
                    callback(event ?? 'SIGNED_OUT', null);
                    return;
                }
        
                const authUser = session.user;
        
                let { data: userDetails, error: fetchError } = await getSupabase()
                    .from('app_users')
                    .select('*')
                    .eq('user_id', authUser.id)
                    .single();
                
                // If no user record is found, create one. This is crucial for new sign-ups.
                if (fetchError && fetchError.code === 'PGRST116') {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 90);
                    const newUserPayload = {
                        user_id: authUser.id,
                        email: authUser.email || '', // Hardened: Ensure email is not null
                        status: 'active' as const,
                        subscription_expiry_date: expiryDate.toISOString(),
                        role: 'user' as const,
                    };
        
                    const { data: newUserDetails, error: insertError } = await getSupabase()
                        .from('app_users')
                        .insert(newUserPayload)
                        .select()
                        .single();
                    
                    if (insertError) {
                         console.error("Could not create user profile on auth change. Logging user out.", insertError);
                         callback(event, null);
                         return;
                    }
                    userDetails = newUserDetails;
                } else if (fetchError) {
                    console.error(`Auth state change error fetching user details: ${fetchError.message}. ${RLS_HINT} Ensure 'app_users' is readable.`);
                    callback(event, null);
                    return;
                }
                
                if (userDetails) {
                    const expiryDate = new Date(userDetails.subscription_expiry_date);
                    const now = new Date();
                    if (expiryDate < now && userDetails.status === 'active') {
                        const { data: updatedUserDetails, error: updateError } = await getSupabase()
                            .from('app_users')
                            .update({ status: 'expired' })
                            .eq('user_id', authUser.id)
                            .select()
                            .single();
        
                        if (updateError) {
                            console.error(`Failed to update user status on auth change: ${updateError.message}. ${RLS_HINT} Ensure 'app_users' is updatable.`);
                        } else {
                            userDetails = updatedUserDetails;
                        }
                    }
                }
        
                callback(event, formatUser(authUser, userDetails));
            } catch (e) {
                console.error("Unhandled error in onAuthStateChange:", e);
                callback(event, null);
            }
        });
    
        if (!data?.subscription) {
            console.error("onAuthStateChange did not return a subscription object.");
            throw new ApiError("Could not set up authentication listener. Please refresh the page.", "No subscription object returned");
        }
    
        return data.subscription;
    },

    updatePassword: async (password: string): Promise<void> => {
        const { error } = await getSupabase().auth.updateUser({ password });
        if (error) {
            throw new ApiError("Password update failed. It might be too weak or the same as the old one. Please try again.", error);
        }
    },

    // USER DATA
    getUserProfile: async (userId: string): Promise<UserProfile | null> => {
        const { data, error } = await getSupabase().from('user_profiles').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') {
             throw new ApiError("Could not load your profile. Please refresh the page.", error);
        }
        return data;
    },

    getChildren: async (userId: string): Promise<Child[]> => {
        const { data, error } = await getSupabase().from('children').select('*').eq('user_id', userId);
        if (error) throw new ApiError("Could not load child details. Please refresh the page.", error);
        return data || [];
    },

    saveUserProfile: async (userId: string, profile: Omit<UserProfile, 'user_id' | 'updated_at'>): Promise<UserProfile> => {
        const { data, error } = await getSupabase().from('user_profiles').upsert({ user_id: userId, ...profile }).select().single();
        if (error) throw new ApiError("Failed to save your profile. Please check your details and try again.", error);
        return data;
    },

    saveChild: async (userId: string, child: Omit<Child, 'user_id' | 'id' | 'created_at'>): Promise<Child> => {
        const { data, error } = await getSupabase().from('children').insert({ user_id: userId, ...child }).select().single();
        if (error) throw new ApiError("Failed to save child's details. Please try again.", error);
        return data;
    },
    
    getRenewalLink: async (): Promise<string | null> => {
        const { data, error } = await getSupabase().from('app_settings').select('value').eq('key', 'renewal_url').single();
        if (error) {
            console.error(`Error fetching renewal link: ${error.message}. ${RLS_HINT} (Table: app_settings)`);
            return null; // Don't show a user-facing error for this, just fail gracefully.
        }
        return data?.value || null;
    },

    getUserDaysRemaining: async (userId: string): Promise<UserDaysRemaining | null> => {
        const { data, error } = await getSupabase().from('app_users').select('subscription_expiry_date, status').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') {
            console.error(`Error fetching user expiry: ${error.message}. ${RLS_HINT} (Table: app_users)`);
            return null;
        }
        if (!data?.subscription_expiry_date) return { user_id: userId, days_remaining: 0, status: 'expired' };

        const expiryDate = new Date(data.subscription_expiry_date);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            user_id: userId,
            days_remaining: Math.max(0, diffDays),
            status: data.status as 'active' | 'expired',
        };
    },

    // TOOL HISTORY
    getPlannerHistory: async (userId: string): Promise<PlannerRun[]> => {
        const { data, error } = await getSupabase().from('planner_runs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw new ApiError("Failed to load your planner history.", error);
        return data || [];
    },

    savePlannerRun: async (run: Omit<PlannerRun, 'id' | 'created_at'>): Promise<PlannerRun> => {
        const { data, error } = await getSupabase().from('planner_runs').insert(run).select().single();
        if (error) throw new ApiError("Failed to save your planner session to history.", error);
        return data;
    },

    getMealPlanHistory: async (userId: string): Promise<MealPlanRun[]> => {
        const { data, error } = await getSupabase().from('mealplan_runs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw new ApiError("Failed to load your meal plan history.", error);
        return data || [];
    },

    saveMealPlanRun: async (run: Omit<MealPlanRun, 'id' | 'created_at'>): Promise<MealPlanRun> => {
        const { data, error } = await getSupabase().from('mealplan_runs').insert(run).select().single();
        if (error) throw new ApiError("Failed to save your meal plan to history.", error);
        return data;
    },
    
    getEmotionLogHistory: async (userId: string): Promise<EmotionLog[]> => {
        const { data, error } = await getSupabase().from('emotion_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw new ApiError("Failed to load your check-in history.", error);
        return data || [];
    },

    saveEmotionLog: async (log: Omit<EmotionLog, 'id' | 'created_at'>): Promise<EmotionLog> => {
        const { data, error } = await getSupabase().from('emotion_logs').insert(log).select().single();
        if (error) throw new ApiError("Failed to save your emotional check-in to history.", error);
        return data;
    },
    
    // ADMIN FUNCTIONS
    getAdminStats: async () => {
        const { data: summaryData, error: summaryError } = await getSupabase()
            .from('admin_user_summary')
            .select('*')
            .single();

        if (summaryError && summaryError.code !== 'PGRST116') { // PGRST116 means no rows found, which is not a fatal error
            throw new ApiError("Could not load admin dashboard statistics.", summaryError);
        }

        const safeSummary = summaryData || {};

        const plannerUsage = { total: safeSummary.planner_logs ?? 0, day: safeSummary.planner_last_24h ?? 0, month: safeSummary.planner_mtd ?? 0 };
        const mealUsage = { total: safeSummary.mealplan_logs ?? 0, day: safeSummary.mealplan_last_24h ?? 0, month: safeSummary.mealplan_mtd ?? 0 };
        const emotionUsage = { total: safeSummary.emotion_logs ?? 0, day: safeSummary.emotion_last_24h ?? 0, month: safeSummary.emotion_mtd ?? 0 };

        return {
            activeUsers: safeSummary.active_users ?? 0,
            expiredUsers: safeSummary.expired_users ?? 0,
            renewedUsers: safeSummary.renewed_users ?? 0,
            expiringSoon: safeSummary.expiring_soon_users ?? 0,
            registeredUsers: safeSummary.total_users ?? 0,
            totalLogs: safeSummary.total_logs ?? 0,
            toolUsage: { planner: plannerUsage, meal: mealUsage, emotion: emotionUsage },
            geminiCost: { total: safeSummary.gemini_cost_total ?? 0, month: safeSummary.gemini_cost_mtd ?? 0, day: safeSummary.gemini_cost_24h ?? 0 }
        };
    },
    
    getExpiringSoonUsers: async () => {
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await getSupabase().from('app_users')
          .select('email, subscription_expiry_date')
          .eq('status', 'active')
          .lte('subscription_expiry_date', sevenDaysFromNow);
        
        if (error) throw new ApiError("Failed to get list of expiring users.", error);
        return data.map(u => ({ email: u.email, expiryDate: u.subscription_expiry_date }));
    },

    updateRenewalLink: async (newLink: string): Promise<void> => {
        const { error } = await getSupabase().from('app_settings').update({ value: newLink }).eq('key', 'renewal_url');
        if (error) throw new ApiError("Failed to update the renewal link.", error);
    },

    adminCreateUser: async (email: string, password: string): Promise<UserResponse> => {
        const { data, error } = await getSupabase().rpc('admin_create_user', { email, password });
        if (error) throw new ApiError("Failed to create the user. They may already exist.", error);
        return data;
    },

    getAllDataForExport: async () => {
        const tables = ['app_users', 'user_profiles', 'children', 'planner_runs', 'mealplan_runs', 'emotion_logs'];
        const promises = tables.map(table => getSupabase().from(table).select('*'));
        
        const results = await Promise.all(promises);
        const data: { [key: string]: any[] } = {};

        for (let i = 0; i < tables.length; i++) {
            if (results[i].error) {
                throw new ApiError(`Failed to export data from the '${tables[i]}' table.`, results[i].error);
            } else {
                const tableData = (results[i].data || []).map(row => {
                    const newRow = {...row};
                    if(newRow.prompt) newRow.prompt = JSON.stringify(newRow.prompt);
                    if(newRow.result) newRow.result = JSON.stringify(newRow.result);
                    return newRow;
                });
                data[tables[i]] = tableData;
            }
        }
        return data;
    },
};