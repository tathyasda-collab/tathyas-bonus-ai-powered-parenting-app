
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Fix: Add a global declaration for window.APP_CONFIG to make TypeScript aware of it.
declare global {
  interface Window {
    APP_CONFIG?: {
      env?: {
        SUPABASE_URL?: string;
        SUPABASE_ANON_KEY?: string;
        API_KEY?: string;
      };
    };
  }
}

export interface AuthUser {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User extends SupabaseUser {}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
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
  baby_name?: string;
  baby_gender?: string;
  baby_date_of_birth?: string;
  child_age?: number;
  goals?: string;
  challenges?: string;
  preferred_language?: string;
  setup_completed?: boolean;
  role?: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface Child {
  id?: string;
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  interests?: string;
  created_at?: string;
}

export interface PlannerRun {
  id?: string;
  user_id: string;
  requested_routine: string; // activity area
  parenting_tip_of_the_day: string; // parenting tip
  prompt: string; // original prompt sent
  result: { time: string; activity: string; details: string }[]; // daily schedule
  start_time?: string;
  end_time?: string; // note: using underscore as requested
  language: string;
  requested_text?: string; // additional focus areas
  created_at?: string;
}

export interface MealPlanRun {
  id?: string;
  user_id: string;
  prompt: {
    childName: string;
    childAge: number;
    motherAge?: number;
    dietaryPreferences: string[];
    additionalInstructions?: string;
    language: string;
  };
  result: {
    breakfast: {
      baby: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
      mother: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
    };
    lunch: {
      baby: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
      mother: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
    };
    dinner: {
      baby: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
      mother: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
    };
    snack: {
      baby: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
      mother: {
        name: string;
        recipe: string;
        ingredients: string[];
        instructions: string;
      };
    };
    shopping_list: string[];
  };
  created_at?: string;
}

export interface SingleRecipeRun {
    id?: string;
    user_id: string;
    prompt: {
        dishName: string;
        language: string;
    };
    result: {
        dish_name: string;
        description?: string;
        prep_time?: string;
        cook_time?: string;
        total_time?: string;
        servings?: string;
        difficulty?: string;
        ingredients: Array<{
            item: string;
            notes?: string;
        }> | string[]; // Support both old and new format
        instructions: Array<{
            step: number;
            title?: string;
            instruction: string;
            tip?: string;
        }> | string[]; // Support both old and new format
        expert_tips?: string[];
        variations?: string[];
        nutritional_info?: string;
        storage_tips?: string;
        shopping_list: string[];
    };
    created_at?: string;
}

export interface EmotionLog {
  id?: string;
  user_id: string;
  mood: string;
  prompt?: string; // renamed from note to match database
  result: string;  // renamed from response to match database
  context?: any;   // added to match database schema
  created_at?: string;
}

export interface UserDaysRemaining {
  days_remaining: number;
  is_active: boolean;
  renewal_link: string | null;
}

export class ApiError extends Error {
  public data?: any;

  constructor(message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.data = data;
  }
}