
import { getSupabase } from './supabaseClient';
import type { Child, PlannerRun, MealPlanRun, SingleRecipeRun } from '../types';
import { ApiError } from '../types';

// Get Supabase URL for edge functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function generateParentingPlan(
  user: { fullName: string },
  child: Child,
  focusAreas: string,
  language: string,
  startTime?: string,
  endTime?: string
): Promise<{ daily_plan: { time: string; activity: string; details: string }[]; parenting_tip: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-parenting-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        user,
        child,
        focusAreas,
        language,
        startTime,
        endTime
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('generateParentingPlan error:', error);
    throw new ApiError("Failed to generate the parenting plan. Please try again.");
  }
}

export async function generateMealPlan(
  child: { name: string, age: number },
  dietaryPreferences: string[],
  language: string,
  motherAge?: number,
  additionalInstructions?: string
): Promise<MealPlanRun['result']> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-meal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        child,
        dietaryPreferences,
        language,
        motherAge,
        additionalInstructions
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Meal plan generated successfully via edge function');
    return result;
  } catch (error) {
    console.error('generateMealPlan error:', error);
    throw new ApiError("Failed to generate the meal plan. Please try again.");
  }
}

export async function generateSingleRecipe(
  dishName: string,
  language: string
): Promise<SingleRecipeRun['result']> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-single-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        dishName,
        language
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('generateSingleRecipe error:', error);
    throw new ApiError("Failed to generate the recipe. Please try again.");
  }
}

export async function getEmotionSupport(
  mood: string,
  note: string | undefined,
  language: string,
  userName?: string
): Promise<string> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-emotion-support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        mood,
        note,
        language,
        userName
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.message;
  } catch (error) {
    console.error('getEmotionSupport error:', error);
    throw new ApiError("Failed to get emotional support. Please try again.");
  }
}