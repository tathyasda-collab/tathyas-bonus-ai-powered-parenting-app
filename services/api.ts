import { getSupabase } from './supabaseClient';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { UserProfile, Child, PlannerRun, MealPlanRun, EmotionLog, SingleRecipeRun } from '../types';
import { ApiError } from '../types';

// Re-export ApiError for external use
export { ApiError } from '../types';

// Auth Functions
export const login = async (email: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw new ApiError(error.message);
};

// Diagnostic function to check database tables
export const checkDatabaseTables = async () => {
  const supabase = getSupabase();
  const results: Record<string, boolean> = {};
  
  // List of tables to check based on your schema
  const tables = ['auth_users', 'app_users', 'user_profiles', 'children'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        results[table] = false;
      } else {
        results[table] = true;
      }
    } catch (e) {
      results[table] = false;
    }
  }
  
  return results;
};

// Test authentication function (simplified)
export const testSupabaseAuth = async (email: string, password: string) => {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (data.user) {
      return { success: true, user: data.user };
    }
    
    return { success: false, error: 'No user data returned' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Profile completion for first-time logins
export const completeUserProfile = async (profileData: {
  // User profile fields
  full_name: string;
  gender?: string;
  age?: number;
  phone?: string;
  spouse_name?: string;
  spouse_gender?: string;
  spouse_age?: number;
  street_address?: string;
  address?: string;
  district?: string;
  state?: string;
  pin_code?: string;
  preferred_language: string;
  goals: string;
  challenges: string;
  
  // Child fields
  baby_name: string;
  baby_gender: string;
  baby_date_of_birth?: string;
  child_age: number;
  child_interests?: string;
}) => {
  const supabase = getSupabase();
  
  try {
    // Get current user session and auth user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new ApiError('No active session found. Please log in again.');
    }

    const email = user.email;
    const userId = user.id; // This is the proper UUID from Supabase auth
    
    console.log('Profile setup for user:', { email, userId });
    
    console.log('Completing profile for user:', email);

    let profileSaved = false;
    let childSaved = false;
    let profileRecord = null;

    // Use the actual user_profiles table structure from the database
    try {
      const userProfileData = {
        auth_user_id: userId,
        name: profileData.full_name,
        gender: profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1).toLowerCase() : null, // Capitalize first letter
        age: profileData.age?.toString(),
        street: profileData.street_address,
        district: profileData.district,
        state: profileData.state,
        pincode: profileData.pin_code, // Fixed: database uses 'pincode' not 'pin_code'
        address: profileData.address,
        spouse_name: profileData.spouse_name,
        spouse_gender: profileData.spouse_gender ? profileData.spouse_gender.charAt(0).toUpperCase() + profileData.spouse_gender.slice(1).toLowerCase() : null, // Capitalize first letter
        spouse_age: profileData.spouse_age?.toString(),
        phone: profileData.phone,
        updated_at: new Date().toISOString()
      };

      console.log('🔍 Attempting to save to user_profiles table:', userProfileData);

      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .insert(userProfileData)
        .select()
        .single();

      if (!userProfileError && userProfile) {
        console.log('✅ Profile saved to user_profiles table:', userProfile);
        profileRecord = userProfile;
        profileSaved = true;
      } else {
        console.log('❌ user_profiles table failed:', userProfileError?.message);
        console.error('Full error details:', userProfileError);
      }
    } catch (err) {
      console.log('user_profiles table error:', err);
    }

    // Try to save child data using the actual children table schema
    if (profileData.baby_name && profileData.baby_gender) {
      try {
        const childData = {
          auth_user_id: userId,
          baby_name: profileData.baby_name,
          baby_dob: profileData.baby_date_of_birth ? new Date(profileData.baby_date_of_birth).toISOString().split('T')[0] : null,
          created_at: new Date().toISOString()
        };

        console.log('🔍 Attempting to save child data:', childData);

        const { data: childRecord, error: childError } = await supabase
          .from('children')
          .insert(childData)
          .select()
          .single();

        if (!childError && childRecord) {
          console.log('✅ Child data saved successfully:', childRecord);
          childSaved = true;
        } else {
          console.log('❌ Child data save failed:', childError?.message);
          console.error('Full child error details:', childError);
        }
      } catch (childErr) {
        console.log('children table error:', childErr);
      }
    }

    // Always store comprehensive data in localStorage
    const completeProfileData = {
      id: userId,
      email: email,
      ...profileData,
      profile_completed: true,
      setup_completed: true,
      profileSaved,
      childSaved,
      saved_at: new Date().toISOString()
    };

    localStorage.setItem('complete_user_profile', JSON.stringify(completeProfileData));
    console.log('✅ Complete profile data stored in localStorage');

    // Update session to remove setup requirement
    const updatedSession = {
      id: userId,
      email: email,
      needsProfileSetup: false,
      full_name: profileData.full_name,
      profile_completed: true
    };
    localStorage.setItem('user_session', JSON.stringify(updatedSession));

    // Dispatch auth change event
    window.dispatchEvent(new CustomEvent('auth-change', {
      detail: { user: updatedSession, authenticated: true }
    }));

    // Return success result
    const result = {
      success: true,
      profileSaved,
      childSaved,
      profileRecord,
      message: profileSaved 
        ? 'Profile saved to database and localStorage' 
        : 'Profile saved to localStorage (database unavailable)',
      storageMethods: {
        database: profileSaved,
        localStorage: true,
        childDatabase: childSaved
      }
    };

    console.log('🎉 Profile setup completed:', result);
    return result;
    
  } catch (error: any) {
    console.error('❌ Profile completion error:', error);
    
    // Emergency fallback - save to localStorage
    try {
      const emergencyData = {
        ...profileData,
        emergency_save: true,
        error_message: error.message,
        saved_at: new Date().toISOString()
      };
      localStorage.setItem('emergency_profile_data', JSON.stringify(emergencyData));
      console.log('🚨 Emergency: Profile data saved to localStorage');
    } catch (storageErr) {
      console.error('Failed to save emergency data:', storageErr);
    }
    
    throw error instanceof ApiError ? error : new ApiError('Failed to complete profile setup');
  }
};

// Test user creation function (for development)
export const createTestUser = async (email: string, password: string) => {
  const supabase = getSupabase();
  
  try {
    console.log('Creating test user:', email);
    
    // Create user with Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (error) {
      throw new ApiError('Failed to create user: ' + error.message);
    }
    
    if (data.user) {
      // Create app_users entry with new schema
      const { error: appUserError } = await supabase
        .from('app_users')
        .insert({
          auth_user_id: data.user.id,
          email: email.toLowerCase().trim(),
          name: 'Test User',
          role: 'user',
          status: 'active',
          subscription_renewed: false,
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      
      if (appUserError) {
        console.warn('Failed to create app_users entry:', appUserError);
      }
      
      console.log('✅ Test user created successfully');
      return data.user;
    }
    
    throw new ApiError('Failed to create user');
  } catch (error: any) {
    console.error('Create user error:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to create test user');
  }
};

// Expose createTestUser to window for console access
if (typeof window !== 'undefined') {
  (window as any).createTestUser = createTestUser;
}

// Authentication Functions - Simplified for debugging auth issues
export const loginWithPassword = async (email: string, password: string) => {
  const supabase = getSupabase();
  
  try {
    console.log('🔍 Starting login for:', email);
    
    // Step 1: Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });
    
    console.log('🔍 Auth response:', { data: !!data, error: error?.message });
    
    if (error || !data.user) {
      console.error('❌ Auth failed:', error?.message || 'No user data');
      throw new ApiError('Invalid email or password');
    }

    console.log('✅ Supabase auth successful');

    // Step 2: Fetch user role and profile information from app_users table
    let userRole = 'user';
    let userName = data.user.user_metadata?.full_name || email.split('@')[0];
    let needsProfileSetup = true; // Default to true for new users
    
    try {
      const { data: appUserData, error: appUserError } = await supabase
        .from('app_users')
        .select('role, name, created_at')
        .eq('auth_user_id', data.user.id)
        .single();
        
      if (!appUserError && appUserData) {
        userRole = appUserData.role || 'user';
        userName = appUserData.name || userName;
        
        // Check if this is a first-time login and profile needs setup
        // Profile setup is needed for regular users if:
        // 1. User was created recently (within last 7 days), AND
        // 2. User has minimal profile info (just email-derived name), AND
        // 3. User is not an admin
        
        const isRecentUser = appUserData.created_at && 
          new Date(appUserData.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const hasMinimalProfile = !appUserData.name || 
          appUserData.name === email.split('@')[0] || 
          appUserData.name.includes('@') ||
          appUserData.name.length < 3;
        
        // Admin users skip profile setup
        if (userRole === 'admin') {
          needsProfileSetup = false;
        } else {
          // Regular users need profile setup if they're recent AND have minimal profile
          needsProfileSetup = isRecentUser && hasMinimalProfile;
        }
        
        console.log('✅ Found user role:', userRole);
        console.log('🔍 Profile setup needed:', needsProfileSetup, {
          isRecentUser,
          hasMinimalProfile,
          userAge: appUserData.created_at ? `${Math.round((Date.now() - new Date(appUserData.created_at).getTime()) / (24 * 60 * 60 * 1000))} days` : 'unknown'
        });
      } else {
        console.log('⚠️ No app_users record found, using default role');
        // If no app_users record, definitely needs profile setup (unless admin)
        needsProfileSetup = userRole !== 'admin';
      }
    } catch (roleError) {
      console.log('⚠️ Error fetching role, using default:', roleError);
      needsProfileSetup = true; // Default to needing setup on error
    }

    // Step 3: Create user session with correct role and profile setup status
    const userSession = {
      id: data.user.id,
      email: data.user.email,
      role: userRole, // Use actual role from database
      full_name: userName,
      authenticated: true,
      needsProfileSetup: needsProfileSetup, // Properly determined based on profile state
      loginTime: new Date().toISOString()
    };

    // Store session in localStorage
    localStorage.setItem('user_session', JSON.stringify(userSession));
    localStorage.setItem('supabase_session', JSON.stringify(data.session));
    
    // Dispatch auth change event
    window.dispatchEvent(new CustomEvent('auth-change', {
      detail: { user: userSession, authenticated: true }
    }));

    console.log('✅ Login completed successfully with role:', userRole);
    return { user: data.user, needsProfileSetup: needsProfileSetup };
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Login failed. Please check your credentials.');
  }
};

export const logout = async () => {
  const supabase = getSupabase();
  
  // Clear custom session first
  localStorage.removeItem('user_session');
  localStorage.removeItem('supabase_session');
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Trigger custom auth change event
  window.dispatchEvent(new CustomEvent('auth-change', {
    detail: { user: null, authenticated: false }
  }));
};

export const forgotPassword = async (email: string) => {
  const supabase = getSupabase();
  
  try {
    // Get the current origin for the redirect URL
    const redirectTo = `${window.location.origin}/reset-password`;
    
    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', redirectTo);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
    
    if (error) {
      console.error('Password reset error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Unable to validate email address')) {
        throw new ApiError('Please enter a valid email address.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new ApiError('Please verify your email address first before resetting password.');
      }
      if (error.message.includes('User not found')) {
        throw new ApiError('No account found with this email address.');
      }
      
      throw new ApiError(error.message);
    }
    
    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Password reset request failed:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to send password reset email. Please try again.');
  }
};

export const updatePassword = async (password: string) => {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new ApiError(error.message);
};

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
  const supabase = getSupabase();
  return supabase.auth.onAuthStateChange(callback);
};

// Check if user is authenticated
export const getCurrentUser = async () => {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Get user subscription info for header display with real-time status calculation
export const getUserSubscriptionInfo = async (userEmail: string) => {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.rpc('get_user_subscription_status', {
      user_email: userEmail
    });
    
    if (error) {
      console.warn('Failed to get subscription info:', error);
      return null;
    }
    
    // Return formatted data for header display
    if (data && data.length > 0) {
      const subscription = data[0];
      return {
        days_remaining: subscription.subscription_remaining_days || 0,
        expiry_date: subscription.subscription_expiry_date,
        is_active: subscription.is_active || false,
        status: subscription.status || 'unknown',
        renewal_needed: subscription.renewal_needed || false
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return null;
  }
};

// Renew user subscription
export const renewUserSubscription = async (userEmail: string) => {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.rpc('renew_user_subscription', {
      user_email: userEmail
    });
    
    if (error) {
      throw new ApiError('Failed to renew subscription: ' + error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }
};

// Update renewal URL (admin function)
export const updateRenewalUrl = async (newUrl: string) => {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.rpc('update_renewal_url', {
      new_url: newUrl
    });
    
    if (error) {
      throw new ApiError('Failed to update renewal URL: ' + error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating renewal URL:', error);
    throw error;
  }
};

// Refresh all subscription statuses (admin function)
export const refreshAllSubscriptionStatuses = async () => {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.rpc('refresh_all_subscription_statuses');
    
    if (error) {
      throw new ApiError('Failed to refresh subscription statuses: ' + error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error refreshing subscription statuses:', error);
    throw error;
  }
};

// Get users expiring soon (admin function)
export const getUsersExpiringSoon = async (daysThreshold: number = 7) => {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase.rpc('get_users_expiring_soon', {
      days_threshold: daysThreshold
    });
    
    if (error) {
      throw new ApiError('Failed to get expiring users: ' + error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting expiring users:', error);
    return [];
  }
};

// User Data Functions
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const supabase = getSupabase();
  
  console.log('getUserProfile called with userId:', userId);
  
  // Get user email from localStorage for fallback searches
  const userSession = localStorage.getItem('user_session');
  let userEmail = '';
  if (userSession) {
    try {
      const userData = JSON.parse(userSession);
      userEmail = userData.email;
      console.log('Found email in session:', userEmail);
    } catch (e) {
      console.log('Failed to parse user session');
    }
  }

  // Try user_profiles table first (using new schema with auth_user_id)
  const { data: userProfileData, error: userProfileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .single();
    
  console.log('user_profiles query by auth_user_id result:', { data: userProfileData, error: userProfileError });
  
  if (!userProfileError && userProfileData) {
    console.log('Found data in user_profiles by auth_user_id, returning profile');
    return {
      id: userProfileData.auth_user_id,
      email: userProfileData.email,
      full_name: userProfileData.name || userProfileData.full_name,
      gender: userProfileData.gender,
      age: userProfileData.age,
      phone: userProfileData.phone,
      spouse_name: userProfileData.spouse_name,
      spouse_gender: userProfileData.spouse_gender,
      spouse_age: userProfileData.spouse_age,
      street_address: userProfileData.street || userProfileData.street_address,
      address: userProfileData.address,
      district: userProfileData.district,
      state: userProfileData.state,
      pin_code: userProfileData.pincode || userProfileData.pin_code,
      baby_name: userProfileData.baby_name,
      baby_gender: userProfileData.baby_gender,
      baby_date_of_birth: userProfileData.baby_date_of_birth,
      role: userProfileData.role || 'user',
      created_at: userProfileData.created_at,
      updated_at: userProfileData.updated_at
    };
  }

  // If user_profiles by user_id failed and we have email, try by email
  if (userEmail) {
    const { data: userProfileByEmail, error: userProfileEmailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', userEmail)
      .single();
      
    console.log('user_profiles query by email result:', { data: userProfileByEmail, error: userProfileEmailError });
      
    if (!userProfileEmailError && userProfileByEmail) {
      console.log('Found data in user_profiles by email, returning profile');
      return {
        id: userProfileByEmail.user_id,
        email: userProfileByEmail.email,
        full_name: userProfileByEmail.name || userProfileByEmail.full_name,
        gender: userProfileByEmail.gender,
        age: userProfileByEmail.age,
        phone: userProfileByEmail.phone,
        spouse_name: userProfileByEmail.spouse_name,
        spouse_gender: userProfileByEmail.spouse_gender,
        spouse_age: userProfileByEmail.spouse_age,
        street_address: userProfileByEmail.street || userProfileByEmail.street_address,
        address: userProfileByEmail.address,
        district: userProfileByEmail.district,
        state: userProfileByEmail.state,
        pin_code: userProfileByEmail.pincode || userProfileByEmail.pin_code,
        baby_name: userProfileByEmail.baby_name,
        baby_gender: userProfileByEmail.baby_gender,
        baby_date_of_birth: userProfileByEmail.baby_date_of_birth,
        role: userProfileByEmail.role || 'user',
        created_at: userProfileByEmail.created_at,
        updated_at: userProfileByEmail.updated_at
      };
    }
  }

  // Try app_users table as fallback (using new schema with auth_user_id)
  const { data: appUserProfileData, error: appUserProfileError } = await supabase
    .from('app_users')
    .select('*')
    .eq('auth_user_id', userId)
    .single();
    
  console.log('app_users query by auth_user_id result:', { data: appUserProfileData, error: appUserProfileError });
    
  if (!appUserProfileError && appUserProfileData) {
    console.log('Found data in app_users by auth_user_id, returning profile');
    const profileResult = {
      id: appUserProfileData.auth_user_id,
      email: appUserProfileData.email,
      full_name: appUserProfileData.name,
      gender: appUserProfileData.gender,
      age: appUserProfileData.age,
      phone: appUserProfileData.phone,
      spouse_name: appUserProfileData.spouse_name,
      spouse_gender: appUserProfileData.spouse_gender,
      spouse_age: appUserProfileData.spouse_age,
      street_address: appUserProfileData.street,
      address: appUserProfileData.address,
      district: appUserProfileData.district,
      state: appUserProfileData.state,
      pin_code: appUserProfileData.pincode || appUserProfileData.pin_code,
      baby_name: appUserProfileData.baby_name,
      baby_gender: appUserProfileData.baby_gender,
      baby_date_of_birth: appUserProfileData.baby_date_of_birth,
      role: appUserProfileData.role || 'user',
      created_at: appUserProfileData.created_at,
      updated_at: appUserProfileData.updated_at
    };
    console.log('Mapped profile result:', profileResult);
    console.log('Raw database data:', appUserProfileData);
    return profileResult;
  }

  // Try app_users by email as final fallback
  if (userEmail) {
    const { data: appUserByEmail, error: emailError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', userEmail)
      .single();
      
    console.log('app_users query by email result:', { data: appUserByEmail, error: emailError });
      
    if (!emailError && appUserByEmail) {
      console.log('Found data in app_users by email, returning profile');
      return {
        id: appUserByEmail.user_id,
        email: appUserByEmail.email,
        full_name: appUserByEmail.name,
        gender: appUserByEmail.gender,
        age: appUserByEmail.age,
        phone: appUserByEmail.phone,
        spouse_name: appUserByEmail.spouse_name,
        spouse_gender: appUserByEmail.spouse_gender,
        spouse_age: appUserByEmail.spouse_age,
        street_address: appUserByEmail.street,
        address: appUserByEmail.address,
        district: appUserByEmail.district,
        state: appUserByEmail.state,
        pin_code: appUserByEmail.pincode || appUserByEmail.pin_code,
        baby_name: appUserByEmail.baby_name,
        baby_gender: appUserByEmail.baby_gender,
        baby_date_of_birth: appUserByEmail.baby_date_of_birth,
        role: appUserByEmail.role || 'user',
        created_at: appUserByEmail.created_at,
        updated_at: appUserByEmail.updated_at
      };
    }
  }

  console.log('No profile data found in any table');
  return null;
  
  // Fallback to user_profiles table if no app_users record found
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  console.log('user_profiles query result:', { data: profileData, error: profileError });
  
  if (!profileError && profileData) {
    return {
      id: profileData.user_id,
      email: profileData.email,
      full_name: profileData.name,
      gender: profileData.gender,
      age: profileData.age,
      phone: profileData.phone,
      spouse_name: profileData.spouse_name,
      spouse_gender: profileData.spouse_gender,
      spouse_age: profileData.spouse_age,
      street_address: profileData.street,
      address: profileData.address,
      district: profileData.district,
      state: profileData.state,
      pin_code: profileData.pincode || profileData.pin_code, // Fix: database uses 'pincode'
      baby_name: profileData.baby_name,
      baby_gender: profileData.baby_gender,
      baby_date_of_birth: profileData.baby_date_of_birth,
      role: profileData.role || 'user',
      created_at: profileData.created_at,
      updated_at: profileData.updated_at
    };
  }
  
  // Fallback to app_users table
  const { data: appUserData, error: appUserError } = await supabase
    .from('app_users')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (!appUserError && appUserData) {
    return {
      id: appUserData.user_id,
      email: appUserData.email,
      full_name: appUserData.name,
      gender: appUserData.gender,
      age: appUserData.age,
      phone: appUserData.phone,
      spouse_name: appUserData.spouse_name,
      spouse_gender: appUserData.spouse_gender,
      spouse_age: appUserData.spouse_age,
      street_address: appUserData.street,
      address: appUserData.address,
      district: appUserData.district,
      state: appUserData.state,
      pin_code: appUserData.pincode || appUserData.pin_code,
      baby_name: appUserData.baby_name,
      baby_gender: appUserData.baby_gender,
      baby_date_of_birth: appUserData.baby_date_of_birth,
      role: appUserData.role || 'user',
      created_at: appUserData.created_at,
      updated_at: appUserData.updated_at
    };
  }
  
  if (profileError && profileError.code !== 'PGRST116' && appUserError && appUserError.code !== 'PGRST116') {
    throw new ApiError('Error fetching user profile');
  }
  
  return null;
};

// Function to get the age of the female user (either main user or spouse)
export const getFemaleUserAge = async (userId: string): Promise<number> => {
  const supabase = getSupabase();
  
  const { data: profileData, error } = await supabase
    .from('user_profiles')
    .select('gender, age, spouse_gender, spouse_age')
    .eq('user_id', userId)
    .single();
    
  if (error || !profileData) {
    return 30; // Default fallback age
  }
  
  // Check if main user is female
  if (profileData.gender && profileData.gender.toLowerCase() === 'female' && profileData.age) {
    return profileData.age;
  }
  
  // Check if spouse is female
  if (profileData.spouse_gender && profileData.spouse_gender.toLowerCase() === 'female' && profileData.spouse_age) {
    return profileData.spouse_age;
  }
  
  // If no female found or no age data, return user's age as fallback or default
  return profileData.age || 30;
};

export const saveUserProfile = async (profile: Partial<UserProfile> & { id: string }) => {
  const supabase = getSupabase();
  
  // Update user_profiles table
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      name: profile.full_name,
      role: profile.role
    })
    .eq('user_id', profile.id);
    
  if (profileError) {
    // Try app_users table as fallback
    const { error: appUserError } = await supabase
      .from('app_users')
      .update({
        email: profile.email,
        role: profile.role
      })
      .eq('user_id', profile.id);
      
    if (appUserError) {
      throw new ApiError('Error updating user profile');
    }
  }
};

export const updateUserProfile = async (userId: string, profileData: {
  // User fields
  full_name?: string;
  gender?: string;
  age?: number;
  phone?: string;
  // Spouse fields
  spouse_name?: string;
  spouse_gender?: string;
  spouse_age?: number;
  // Address fields
  street_address?: string;
  address?: string;
  district?: string;
  state?: string;
  pin_code?: string;
}) => {
  const supabase = getSupabase();
  
  // Prepare update data with correct field mappings
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  // Add fields only if they are provided
  if (profileData.full_name !== undefined) updateData.name = profileData.full_name;
  if (profileData.gender !== undefined) {
    // Apply gender capitalization fix
    updateData.gender = profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1).toLowerCase() : null;
  }
  if (profileData.age !== undefined) updateData.age = profileData.age;
  if (profileData.phone !== undefined) updateData.phone = profileData.phone;
  if (profileData.spouse_name !== undefined) updateData.spouse_name = profileData.spouse_name;
  if (profileData.spouse_gender !== undefined) {
    // Apply gender capitalization fix
    updateData.spouse_gender = profileData.spouse_gender ? profileData.spouse_gender.charAt(0).toUpperCase() + profileData.spouse_gender.slice(1).toLowerCase() : null;
  }
  if (profileData.spouse_age !== undefined) updateData.spouse_age = profileData.spouse_age;
  if (profileData.street_address !== undefined) updateData.street = profileData.street_address;
  if (profileData.address !== undefined) updateData.address = profileData.address;
  if (profileData.district !== undefined) updateData.district = profileData.district;
  if (profileData.state !== undefined) updateData.state = profileData.state;
  if (profileData.pin_code !== undefined) updateData.pincode = profileData.pin_code; // Fixed: database uses 'pincode' not 'pin_code'
  
  console.log('🔍 Updating user profile with data:', updateData);
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('auth_user_id', userId)
      .select();
    
    if (error) {
      console.error('❌ Profile update failed:', error);
      throw new ApiError(`Failed to update profile: ${error.message}`);
    }
    
    console.log('✅ Profile updated successfully:', data);
    return data?.[0];
  } catch (err: any) {
    console.error('❌ Profile update error:', err);
    throw err instanceof ApiError ? err : new ApiError('Failed to update profile');
  }
};

// Child Data Functions
export const getChildren = async (userId: string): Promise<Child[]> => {
  const supabase = getSupabase();
  
  try {
    // Get the current user's email to match against database
    const { data: user } = await supabase.auth.getUser();
    const userEmail = user.user?.email;
    
    let data, error;
    
    // Try different field names and approaches for the new schema
    const queries = [
      () => supabase.from('children').select('*').eq('auth_user_id', userId),
      () => supabase.from('children').select('*').eq('parent_id', userId),
      () => supabase.from('children').select('*').eq('user_id', userId),
      () => supabase.from('children').select('*').eq('parent_email', userEmail),
      () => supabase.from('children').select('*').eq('email', userEmail),
    ];
    
    for (const query of queries) {
      try {
        const result = await query();
        if (!result.error && result.data) {
          data = result.data;
          error = null;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (error || !data) {
      console.log('No children found or all queries failed');
      return [];
    }
    
    // Map the database fields to your Child interface
    return data?.map(child => ({
      id: child.child_id || child.id,
      user_id: child.auth_user_id || child.parent_id || child.user_id || userId,
      name: child.baby_name || child.name, // Map baby_name from database to name field
      age: child.baby_age || child.age || 0, // Also check for baby_age column
      gender: child.baby_gender || child.gender || 'other',
      interests: child.interests,
      created_at: child.created_at
    })) || [];
  } catch (e) {
    console.log('Children fetch exception:', e);
    return [];
  }
};

export const saveChild = async (child: Omit<Child, 'id' | 'created_at'>) => {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('children')
    .insert({
      baby_name: child.name,
      auth_user_id: child.user_id,
      baby_dob: null, // Add if you have age to date conversion logic
      interests: child.interests
    });
    
  if (error) throw new ApiError('Error saving child');
};

export const getRenewalLink = async () => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.rpc('get_renewal_url');
    
    if (error) {
      throw new ApiError(error.message);
    }
    
    return data || '';
  } catch (error) {
    console.error('Error getting renewal link:', error);
    return '';
  }
};

// Get user days remaining function with real-time status calculation
export const getUserDaysRemaining = async () => {
  const supabase = getSupabase();
  
  try {
    // Get current user
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new ApiError('User not authenticated');
    }
    
    // Use the new real-time subscription status function
    const { data, error } = await supabase.rpc('get_user_subscription_status', {
      user_email: user.user.email
    });
    
    if (error) {
      console.log('Subscription status query error:', error);
      // Return default values if query fails
      return {
        days_remaining: 30,
        is_active: true,
        renewal_link: null
      };
    }
    
    if (data && data.length > 0) {
      const subscription = data[0];
      return {
        days_remaining: subscription.subscription_remaining_days || 0,
        is_active: subscription.is_active || false,
        renewal_link: null,
        expiry_date: subscription.subscription_expiry_date,
        status: subscription.status
      };
    }
    
    // Default values if no subscription data
    return {
      days_remaining: 30,
      is_active: true,
      renewal_link: null
    };
  } catch (error: any) {
    console.log('getUserDaysRemaining error:', error);
    // Return default values on error
    return {
      days_remaining: 30,
      is_active: true,
      renewal_link: null
    };
  }
};

// In-memory storage for planner runs when database tables don't exist
let inMemoryPlannerRuns: PlannerRun[] = [];

// Tool Functions remain the same...
export const savePlannerRun = async (run: Omit<PlannerRun, 'id' | 'created_at'>) => {
  const supabase = getSupabase();
  
  console.log('savePlannerRun called with data:', run);
  
  try {
    // Convert user_id to auth_user_id for new schema
    const runData = {
      ...run,
      user_id: run.user_id // Keep user_id as is since planner_runs table uses user_id referencing auth.users(id)
    };
    
    console.log('savePlannerRun - Attempting to insert:', runData);
    
    const { data, error } = await supabase.from('planner_runs').insert(runData).select();
    
    console.log('savePlannerRun - Insert result:', { data, error });
    
    if (error) {
      console.log('savePlannerRun - Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.log('savePlannerRun - Database error, falling back to in-memory:', error);
      // Fallback to in-memory storage
      const newRun: PlannerRun = {
        ...run,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      inMemoryPlannerRuns.unshift(newRun); // Add to beginning
      console.log('savePlannerRun - Saved to in-memory, total in-memory runs:', inMemoryPlannerRuns.length);
      return newRun;
    }
    console.log('savePlannerRun - Successfully saved to database:', data?.[0]);
    return data?.[0];
  } catch (err) {
    // Fallback to in-memory storage
    const newRun: PlannerRun = {
      ...run,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    inMemoryPlannerRuns.unshift(newRun); // Add to beginning
    return newRun;
  }
};

export const getPlannerRuns = async (userId: string): Promise<PlannerRun[]> => {
  const supabase = getSupabase();
  
  console.log('getPlannerRuns called with userId:', userId);
  
  try {
    const { data, error } = await supabase
      .from('planner_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log('getPlannerRuns - Supabase query result:', { data, error });
    
    if (error) {
      console.log('getPlannerRuns - Database error, falling back to in-memory:', error);
      // Filter in-memory runs by user ID and return
      const userRuns = inMemoryPlannerRuns.filter(run => run.user_id === userId);
      console.log('getPlannerRuns - In-memory runs for user:', userRuns);
      return userRuns;
    }
    
    // If database query succeeded but returned no data, also check in-memory
    const dbResults = data || [];
    const inMemoryResults = inMemoryPlannerRuns.filter(run => run.user_id === userId);
    
    // Combine database and in-memory results
    const allResults = [...dbResults, ...inMemoryResults];
    
    console.log('getPlannerRuns - Database results:', dbResults.length, 'In-memory results:', inMemoryResults.length);
    console.log('getPlannerRuns - Returning combined data:', allResults.length, 'records');
    return allResults;
  } catch (err) {
    console.log('getPlannerRuns - Exception caught, falling back to in-memory:', err);
    // Filter in-memory runs by user ID and return
    const userRuns = inMemoryPlannerRuns.filter(run => run.user_id === userId);
    console.log('getPlannerRuns - In-memory runs for user:', userRuns);
    return userRuns;
  }
};

export const saveMealPlanRun = async (run: Omit<MealPlanRun, 'id' | 'created_at'>) => {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('meal_plan_runs').insert(run);
    if (error) {
      console.log('Meal plan runs table not found, plan not saved:', error.message);
      return; // Silently fail if table doesn't exist
    }
  } catch (err) {
    console.log('Error saving meal plan run:', err);
    // Don't throw error, just log it
  }
};

export const getMealPlanRuns = async (userId: string): Promise<MealPlanRun[]> => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('meal_plan_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Meal plan runs table not found, returning empty array:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.log('Error fetching meal plan runs, returning empty array:', err);
    return [];
  }
};

export const saveSingleRecipeRun = async (run: Omit<SingleRecipeRun, 'id' | 'created_at'>) => {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('single_recipe_runs').insert(run);
    if (error) {
      console.log('Single recipe runs table not found, recipe not saved:', error.message);
      return; // Silently fail if table doesn't exist
    }
  } catch (err) {
    console.log('Error saving single recipe run:', err);
    // Don't throw error, just log it
  }
};

export const getSingleRecipeRuns = async (userId: string): Promise<SingleRecipeRun[]> => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('single_recipe_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Single recipe runs table not found, returning empty array:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.log('Error fetching single recipe runs, returning empty array:', err);
    return [];
  }
};

export const saveEmotionLog = async (log: Omit<EmotionLog, 'id' | 'created_at'>) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('emotion_logs').insert(log);
  if (error) throw new ApiError(error.message);
};

export const getEmotionLogs = async (userId: string): Promise<EmotionLog[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('emotion_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError(error.message);
  return data || [];
};

// Alias functions for backward compatibility
export const getPlannerHistory = getPlannerRuns;
export const getMealHistory = getMealPlanRuns;
export const getRecipeHistory = getSingleRecipeRuns;
export const getEmotionLogHistory = getEmotionLogs;

// Admin Functions

// Function to refresh admin stats using your Edge Function
export const refreshAdminStats = async () => {
  try {
    console.log('Refreshing admin stats via Edge Function...');
    
    // Call your Supabase Edge Function to update the admin_dashboard_stats table
    const response = await fetch('https://usbvlkjoeujncihgjvzw.supabase.co/functions/v1/admin-stats-updater', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Edge Function call failed, but continuing with existing stats');
      return false;
    }
    
    const result = await response.json();
    console.log('Admin stats refreshed successfully:', result);
    return true;
  } catch (error) {
    console.warn('Failed to refresh admin stats via Edge Function:', error);
    return false; // Don't throw error, just continue with existing stats
  }
};

export const getAdminStats = async (forceRefresh = false) => {
  const supabase = getSupabase();
  
  try {
    // Try to get stats from admin_dashboard_stats view (new schema)
    const { data: viewStats, error: viewError } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .limit(1);
    
    if (!viewError && viewStats && viewStats.length > 0) {
      console.log('Using admin_dashboard_stats view data');
      const stats = viewStats[0];
      return {
        registeredUsers: stats.registered_users || 0,
        activeUsers: stats.active_users || 0,
        expiredUsers: stats.expired_users || 0,
        renewedUsers: stats.renewed_users || 0,
        expiringSoon: stats.expiring_soon || 0,
        totalLogs: stats.total_logs || 0,
        adminUsers: stats.admin_users || 0,
        toolUsage: {
          planner: { 
            total: stats.planner_total || 0, 
            day: stats.planner_day || 0, 
            month: stats.planner_month || 0 
          },
          meal: { 
            total: stats.meal_total || 0, 
            day: stats.meal_day || 0, 
            month: stats.meal_month || 0 
          },
          emotion: { 
            total: stats.emotion_total || 0, 
            day: stats.emotion_day || 0, 
            month: stats.emotion_month || 0 
          },
          product: {
            total: stats.product_total || 0,
            day: stats.product_day || 0,
            month: stats.product_month || 0
          }
        },
        geminiCost: {
          total: parseFloat(stats.gemini_cost_total || '0'),
          month: parseFloat(stats.gemini_cost_month || '0'),
          day: parseFloat(stats.gemini_cost_day || '0')
        },
        lastUpdated: stats.last_updated || stats.created_at
      };
    }
    
    // Fallback to database function if table doesn't have data
    console.log('Falling back to database function');
    const { data, error } = await supabase.rpc('get_admin_statistics');
    
    if (error) {
      console.error('Error fetching admin stats:', error);
      throw new ApiError('Failed to fetch admin statistics');
    }
    
    return data || {
      registeredUsers: 0,
      activeUsers: 0,
      expiredUsers: 0,
      renewedUsers: 0,
      expiringSoon: 0,
      totalLogs: 0,
      toolUsage: {
        planner: { total: 0, day: 0, month: 0 },
        meal: { total: 0, day: 0, month: 0 },
        emotion: { total: 0, day: 0, month: 0 }
      },
      geminiCost: {
        total: 0,
        month: 0,
        day: 0
      }
    };
  } catch (error: any) {
    console.error('Error in getAdminStats:', error);
    throw error instanceof ApiError ? error : new ApiError('Failed to fetch admin statistics');
  }
};

export const updateRenewalLink = async (link: string) => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.rpc('update_renewal_url', { new_url: link });
    
    if (error) {
      throw new ApiError(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating renewal link:', error);
    throw new ApiError('Failed to update renewal link');
  }
};

export const getExpiringSoonUsers = async () => {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.rpc('get_expiring_users_csv');
    
    if (error) {
      throw new ApiError(error.message);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting expiring users:', error);
    return [];
  }
};

export const getAllDataForExport = async () => {
  const supabase = getSupabase();
  try {
    // Get all main tables data
    const [usersResult, userProfilesResult, usageLogsResult, plannerResult, mealResult, emotionResult] = await Promise.all([
      supabase.from('app_users').select('*'),
      supabase.from('user_profiles').select('*'),
      supabase.from('ai_usage_logs').select('*'),
      supabase.from('planner_runs').select('*'),
      supabase.from('meal_plan_runs').select('*'),
      supabase.from('emotion_logs').select('*')
    ]);

    const result = {
      app_users: usersResult.data || [],
      user_profiles: userProfilesResult.data || [],
      ai_usage_logs: usageLogsResult.data || [],
      planner_runs: plannerResult.data || [],
      meal_plan_runs: mealResult.data || [],
      emotion_logs: emotionResult.data || []
    };

    // Add any errors encountered
    const errors = [
      usersResult.error,
      userProfilesResult.error,
      usageLogsResult.error,
      plannerResult.error,
      mealResult.error,
      emotionResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.warn('Some data export queries failed:', errors);
    }

    return result;
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw new ApiError('Failed to export data');
  }
};

export const adminCreateUser = async (email: string, role: 'user' | 'admin' = 'user', password?: string) => {
  const supabase = getSupabase();
  
  try {
    // Store current session to restore later
    const currentSession = await supabase.auth.getSession();
    
    // Check if user exists in app_users first
    const { data: existingAppUser } = await supabase
      .from('app_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingAppUser) {
      throw new ApiError('User with this email already exists in app_users');
    }

    const userPassword = password || Math.random().toString(36).slice(-12) + 'A1!';
    
    // Create a temporary Supabase client for user creation
    const { createClient } = await import('@supabase/supabase-js');
    const tempSupabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Use the temporary client to sign up the new user
    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email: email,
      password: userPassword,
      options: {
        data: {
          full_name: email.split('@')[0]
        }
      }
    });

    if (authError) {
      throw new ApiError(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new ApiError('Failed to create user: No user data returned');
    }

    // Sign out from the temporary client to avoid session conflicts
    await tempSupabase.auth.signOut();

    // Restore the original session
    if (currentSession.data.session) {
      await supabase.auth.setSession(currentSession.data.session);
    }

    // Create corresponding user in app_users table
    const { error: appUserError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: authData.user.id,
        email: email,
        name: email.split('@')[0],
        role: role,
        status: 'active',
        subscription_renewed: true,
        subscription_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (appUserError) {
      console.error('Error creating app user:', appUserError);
      throw new ApiError(`Failed to create user profile: ${appUserError.message}`);
    }

    return {
      id: authData.user.id,
      email: authData.user.email,
      role: role,
      password: password ? undefined : userPassword // Only return password if it was auto-generated
    };
  } catch (error) {
    console.error('Error in adminCreateUser:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create user');
  }
};

export const upgradeUserToAdmin = async (email: string) => {
  const supabase = getSupabase();
  try {
    // Find user in app_users
    const { data: appUser, error: findError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      throw new ApiError(`Error finding user: ${findError.message}`);
    }

    if (!appUser) {
      throw new ApiError('User with this email does not exist');
    }

    if (appUser.role === 'admin') {
      throw new ApiError('User is already an admin');
    }

    // Update user role to admin
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (updateError) {
      throw new ApiError(`Failed to upgrade user: ${updateError.message}`);
    }

    return {
      email: email,
      role: 'admin',
      message: 'User successfully upgraded to admin'
    };
  } catch (error) {
    console.error('Error in upgradeUserToAdmin:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upgrade user to admin');
  }
};