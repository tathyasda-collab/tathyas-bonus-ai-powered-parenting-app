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
        user_id: userId,
        name: profileData.full_name,
        gender: profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1).toLowerCase() : null, // Capitalize first letter
        age: profileData.age,
        street: profileData.street_address,
        district: profileData.district,
        state: profileData.state,
        pincode: profileData.pin_code, // Fixed: database uses 'pincode' not 'pin_code'
        address: profileData.address,
        spouse_name: profileData.spouse_name,
        spouse_gender: profileData.spouse_gender ? profileData.spouse_gender.charAt(0).toUpperCase() + profileData.spouse_gender.slice(1).toLowerCase() : null, // Capitalize first letter
        spouse_age: profileData.spouse_age,
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
          user_id: userId,
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
      // Create app_users entry
      const { error: appUserError } = await supabase
        .from('app_users')
        .insert({
          user_id: data.user.id,
          email: email.toLowerCase().trim(),
          name: 'Test User',
          role: 'user',
          status: 'active',
          subscription_renewed: false
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

// Authentication Functions - Updated comprehensive login flow using Supabase Auth
export const loginWithPassword = async (email: string, password: string) => {
  const supabase = getSupabase();
  
  try {
    // Step 1: Use Supabase's built-in authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    });
    
    if (error || !data.user) {
      throw new ApiError('Invalid email or password');
    }

    // Step 2: Check app_users table for subscription status
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (appUserError || !appUser) {
      // Create default app_users entry if not exists
      const { data: newAppUser, error: createError } = await supabase
        .from('app_users')
        .insert({
          email: email.toLowerCase().trim(),
          user_id: data.user.id,
          status: 'active', // Default to active for testing
          role: 'user',
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          subscription_renewed: false
        })
        .select()
        .single();
      
      if (createError) {
        // Continue with default values
      } else {
        // Default app_users entry created successfully
      }
    }

    // Use appUser data or fallback to defaults
    const userRecord = appUser || {
      status: 'active',
      subscription_renewed: false,
      role: 'user',
      name: data.user.user_metadata?.full_name || email.split('@')[0]
    };

    // Step 3: Check subscription status
    if (userRecord.status === 'expired') {
      // Get renewal URL from app_settings
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('renewal_url')
        .single();
      
      const renewalUrl = settings?.renewal_url || '#';
      
      throw new ApiError('SUBSCRIPTION_EXPIRED', {
        message: 'Your subscription has expired. Please renew to continue using the app.',
        renewalUrl: renewalUrl
      });
    }

    // Step 4: Check if subscription was renewed or if profile setup is needed
    let needsProfileSetup = false;
    if (userRecord.subscription_renewed === true) {
      // Check if profile exists in user_profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileError || !userProfile || !userProfile.name) {
        needsProfileSetup = true;
      }
    } else {
      // Regular user login - still check for profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileError || !userProfile || !userProfile.name) {
        needsProfileSetup = true;
      }
    }

    // Create user session
    const userSession = {
      id: data.user.id,
      email: data.user.email,
      role: userRecord.role || 'user',
      full_name: userRecord.name || data.user.user_metadata?.full_name,
      authenticated: true,
      needsProfileSetup: needsProfileSetup,
      loginTime: new Date().toISOString()
    };

    // Store session in localStorage
    localStorage.setItem('user_session', JSON.stringify(userSession));
    localStorage.setItem('supabase_session', JSON.stringify(data.session));
    
    // Dispatch auth change event
    window.dispatchEvent(new CustomEvent('auth-change', {
      detail: { user: userSession, authenticated: true }
    }));

    
    return { user: data.user, needsProfileSetup };  } catch (error: any) {
    console.error('Login error:', error);
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

  // Try user_profiles table first (since that's where your data seems to be)
  const { data: userProfileData, error: userProfileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  console.log('user_profiles query by user_id result:', { data: userProfileData, error: userProfileError });
  
  if (!userProfileError && userProfileData) {
    console.log('Found data in user_profiles by user_id, returning profile');
    return {
      id: userProfileData.user_id,
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

  // Try app_users table as fallback
  const { data: appUserProfileData, error: appUserProfileError } = await supabase
    .from('app_users')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  console.log('app_users query by user_id result:', { data: appUserProfileData, error: appUserProfileError });
    
  if (!appUserProfileError && appUserProfileData) {
    console.log('Found data in app_users by user_id, returning profile');
    const profileResult = {
      id: appUserProfileData.user_id,
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
      .eq('user_id', userId)
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
    
    // Try different field names and approaches
    const queries = [
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
      user_id: child.parent_id || child.user_id || userId,
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
      name: child.name,
      age: child.age,
      gender: child.gender,
      interests: child.interests,
      parent_id: child.user_id
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

// Get user days remaining function
export const getUserDaysRemaining = async () => {
  const supabase = getSupabase();
  
  try {
    // Try to get user subscription info from app_users table
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new ApiError('User not authenticated');
    }
    
    // Try different possible field names for user identification
    let data, error;
    
    // Try with email first (most likely to exist)
    ({ data, error } = await supabase
      .from('app_users')
      .select('subscription_expiry_date')
      .eq('email', user.user.email)
      .limit(1));
    
    if (error) {
      // Try with user_id if email doesn't work
      ({ data, error } = await supabase
        .from('app_users')
        .select('subscription_expiry_date')
        .eq('id', user.user.id)
        .limit(1));
    }
    
    if (error) {
      console.log('App users query error:', error);
      // Return default values if queries fail
      return {
        days_remaining: 30,
        is_active: true,
        renewal_link: null
      };
    }
    
    const userData = Array.isArray(data) ? data[0] : data;
    
    if (userData?.subscription_expiry_date) {
      const expiryDate = new Date(userData.subscription_expiry_date);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        days_remaining: Math.max(0, diffDays),
        is_active: true, // Default to true since column doesn't exist
        renewal_link: null
      };
    }
    
    // Default values if no expiry date
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
  
  try {
    const { data, error } = await supabase.from('planner_runs').insert(run).select();
    if (error) {
      // Fallback to in-memory storage
      const newRun: PlannerRun = {
        ...run,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      inMemoryPlannerRuns.unshift(newRun); // Add to beginning
      return newRun;
    }
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
  
  try {
    const { data, error } = await supabase
      .from('planner_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      // Filter in-memory runs by user ID and return
      const userRuns = inMemoryPlannerRuns.filter(run => run.user_id === userId);
      return userRuns;
    }
    return data || [];
  } catch (err) {
    // Filter in-memory runs by user ID and return
    const userRuns = inMemoryPlannerRuns.filter(run => run.user_id === userId);
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
export const getAdminStats = async () => {
  const supabase = getSupabase();
  
  try {
    // Use the new admin_dashboard_stats view for real-time calculations
    const { data: statsData, error: statsError } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .single();
    
    if (statsError) {
      console.error('Error fetching admin stats from view:', statsError);
      
      // Fallback: try using the function instead
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_admin_dashboard_stats');
      
      if (functionError) {
        console.error('Error calling admin stats function:', functionError);
        throw new ApiError('Failed to fetch admin statistics');
      }
      
      // Parse the JSON result from the function
      const parsedStats = functionData;
      return {
        registeredUsers: parsedStats.registered_users || 0,
        activeUsers: parsedStats.active_users || 0,
        expiredUsers: parsedStats.expired_users || 0,
        renewedUsers: parsedStats.renewed_users || 0,
        expiringSoon: parsedStats.expiring_soon || 0,
        totalLogs: parsedStats.total_logs || 0,
        toolUsage: parsedStats.tool_usage || {
          planner: { total: 0, day: 0, month: 0 },
          meal: { total: 0, day: 0, month: 0 },
          emotion: { total: 0, day: 0, month: 0 }
        },
        geminiCost: parsedStats.gemini_cost || {
          total: 0,
          month: 0,
          day: 0
        }
      };
    }

    // Use the view data directly
    const stats = statsData;
    return {
      registeredUsers: stats.registered_users || 0,
      activeUsers: stats.active_users || 0,
      expiredUsers: stats.expired_users || 0,
      renewedUsers: stats.renewed_users || 0,
      expiringSoon: stats.expiring_soon || 0,
      totalLogs: stats.total_logs || 0,
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
        }
      },
      geminiCost: {
        total: stats.gemini_cost_total || 0,
        month: stats.gemini_cost_month || 0,
        day: stats.gemini_cost_day || 0
      }
    };

  } catch (error) {
    console.error('Error in getAdminStats:', error);
    
    // Return fallback data with zeros if everything fails
    return {
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

export const adminCreateUser = async (email: string, role: 'user' | 'admin' = 'user') => {
  const supabase = getSupabase();
  try {
    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('auth_users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ApiError('User with this email already exists');
    }

    // Create user in auth_users table with temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email: email,
        password_hash: temporaryPassword, // This should be hashed in production
        role: role,
        is_active: true,
        full_name: null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ApiError('User with this email already exists');
      }
      throw new ApiError(`Failed to create user: ${error.message}`);
    }

    // Create corresponding user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.id,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Don't throw here as the main user creation succeeded
    }

    // In a real application, you would send an invitation email here
    // For now, we'll just log the temporary password
    console.log(`User created with temporary password: ${temporaryPassword}`);
    
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      temporaryPassword: temporaryPassword
    };
  } catch (error) {
    console.error('Error in adminCreateUser:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create user');
  }
};