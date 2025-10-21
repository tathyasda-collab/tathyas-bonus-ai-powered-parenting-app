// Fix: Populating the types.ts file with application-wide type definitions.

export interface User {
    id: string;
    email: string;
    role: 'user' | 'admin';
    status: 'active' | 'expired';
    subscription_expiry: string;
    subscription_renewed?: boolean;
    subscription_renewal_date?: string;
}

export interface UserProfile {
    user_id: string;
    updated_at?: string;
    name: string;
    gender: string;
    age: number;
    pincode: string;
    street: string;
    district: string;
    state: string;
    address: string;
    spouse_name?: string;
    spouse_gender?: string;
    spouse_age?: number;
}

export interface Child {
    id: string;
    user_id: string;
    created_at: string;
    baby_name: string;
    baby_dob: string; // ISO string date
}

export interface PlannerRun {
    id: string;
    user_id: string;
    created_at: string;
    prompt: {
        focus: string[];
        time?: { start?: string, end?: string };
    };
    result: string; // JSON string
    start_time?: string;
    end_time?: string;
}

export interface MealPlanRun {
    id: string;
    user_id: string;
    created_at: string;
    prompt: {
        preferences: string;
    };
    result: string; // JSON string
}

export interface EmotionLog {
    id: string;
    user_id: string;
    created_at: string;
    mood: string;
    prompt: {
        note?: string;
    };
    result: string;
}

export interface UserDaysRemaining {
    user_id: string;
    days_remaining: number;
    status: 'active' | 'expired';
}