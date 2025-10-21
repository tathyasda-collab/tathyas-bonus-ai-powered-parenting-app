import { GoogleGenAI, Type } from "@google/genai";
import { ApiError } from './api';
import { APP_CONFIG } from '../env.js';

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents the app from crashing on initial load if the API key is not provided
 * in the environment. The error will instead occur when an AI feature is used.
 * @returns {GoogleGenAI} The initialized GoogleGenAI client.
 */
const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = APP_CONFIG.env.API_KEY;

        if (!apiKey) {
            // This is a developer-facing error, as the key should always be set.
            throw new Error("Gemini API key is not configured. Please set the API_KEY in your env.js file or deployment environment variables.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};


const generateMealPlan = async (childInfo: string, preferences: string, pincode: string, language: string): Promise<string> => {
    const prompt = `
        You are an expert nutritionist and chef for Indian families. Create a daily meal plan for a mother and her child.
        
        **Context:**
        - Child Details: ${childInfo}
        - Family Preferences: ${preferences}
        - Location (for local ingredient suggestions): Pincode ${pincode}, India.
        - Language for response: ${language}

        **Instructions:**
        1. Create a balanced and healthy meal plan for one full day (Breakfast, Lunch, Evening Snack, Dinner).
        2. Provide one meal option for the mother and one for the child for each mealtime. The meals should be age-appropriate for the child.
        3. The meals should be simple to prepare and use commonly available ingredients in India, considering the location.
        4. Based on the meal plan, generate a shopping list of all required ingredients.
        5. Return the response in a JSON format with the specified schema. Do not include any markdown or explanatory text outside the JSON object.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            meal_plan: {
                type: Type.ARRAY,
                description: "List of meals for the day.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        meal_time: { type: Type.STRING, description: "e.g., Breakfast, Lunch" },
                        mother_meal: { type: Type.STRING, description: "Meal for the mother." },
                        child_meal: { type: Type.STRING, description: "Age-appropriate meal for the child." },
                    },
                    required: ["meal_time", "mother_meal", "child_meal"]
                }
            },
            shopping_list: {
                type: Type.ARRAY,
                description: "A list of all ingredients needed for the meal plan.",
                items: { type: Type.STRING }
            }
        },
        required: ["meal_plan", "shopping_list"]
    };

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        
        return response.text;
    } catch (error) {
        throw new ApiError("The AI assistant failed to generate a meal plan. Please check your connection and try again.", error);
    }
};

const generateSingleRecipe = async (dishName: string, language: string): Promise<string> => {
    const prompt = `
        You are an expert Indian chef. Provide a detailed recipe for the following dish: "${dishName}".
        - Language for response: ${language}

        **Instructions:**
        1. List all necessary ingredients with quantities (e.g., "1 cup", "200g").
        2. Provide clear, step-by-step cooking instructions.
        3. Generate a shopping list for the ingredients.
        4. Return the response in a JSON format with the specified schema. Do not include any markdown or explanatory text outside the JSON object.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            dish_name: { type: Type.STRING, description: "The name of the dish." },
            ingredients: {
                type: Type.ARRAY,
                description: "List of ingredients.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING }
                    },
                    required: ["name", "quantity"]
                }
            },
            instructions: {
                type: Type.ARRAY,
                description: "Step-by-step cooking instructions.",
                items: { type: Type.STRING }
            },
            shopping_list: {
                type: Type.ARRAY,
                description: "Shopping list derived from the ingredients.",
                items: { type: Type.STRING }
            }
        },
        required: ["dish_name", "ingredients", "instructions", "shopping_list"]
    };

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        return response.text;
    } catch (error) {
        throw new ApiError("The AI assistant failed to generate the recipe. Please check the dish name and try again.", error);
    }
};


const getEmotionSupport = async (emotion: string, note: string, name: string, language: string): Promise<string> => {
    const prompt = `
        You are a compassionate and supportive AI companion for parents. A parent, ${name}, is feeling ${emotion}. 
        They have shared the following note (it might be empty): "${note}".

        **Your Task:**
        - Write a brief, gentle, and encouraging message to ${name}.
        - Validate their feelings.
        - Offer a simple, actionable piece of advice or a calming thought.
        - Keep the tone warm, empathetic, and non-judgmental.
        - The response should be in ${language}.
        - Do not use markdown. Just provide the plain text response.
    `;

    try {
        const response = await getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        throw new ApiError("The AI assistant could not provide support at this moment. Please try again later.", error);
    }
};

const generateParentingPlan = async (childInfo: string, parentInfo: string, focusAreas: string[], language: string, startTime?: string, endTime?: string): Promise<string> => {
    const timeConstraint = startTime && endTime
        ? `IMPORTANT: The entire plan, including all activities, must fit strictly between ${startTime} and ${endTime}. Distribute the activities within this timeframe.`
        : "The plan can be for a full day.";

    const prompt = `
        You are a child development expert specializing in creating engaging and educational daily plans for Indian families.

        **Context:**
        - Parent Details: ${parentInfo}
        - Child Details: ${childInfo}
        - Today's Focus Areas: ${focusAreas.join(', ')}
        - Language for response: ${language}

        **Instructions:**
        1. Create a daily activity plan with a few engaging activities for the child.
        2. ${timeConstraint}
        3. For each activity, provide:
           - A name for the activity.
           - A suggested start and end time for the activity.
           - The developmental skill it targets (e.g., Fine Motor, Cognitive, Language, Social-Emotional).
           - A clear, simple description of how to do the activity.
           - A list of materials needed (should be common household items).
        4. The activities should be age-appropriate and culturally relevant for an Indian context.
        5. Include a "Parenting Tip of the Day" that is relevant to the provided context.
        6. Return the response in a JSON format with the specified schema. Do not include any markdown or explanatory text outside the JSON object.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            daily_plan: {
                type: Type.ARRAY,
                description: "List of activities for the day.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        activity_name: { type: Type.STRING },
                        start_time: { type: Type.STRING, description: "e.g., 10:00 AM" },
                        end_time: { type: Type.STRING, description: "e.g., 10:30 AM" },
                        skill_targeted: { type: Type.STRING },
                        description: { type: Type.STRING },
                        materials: { type: Type.STRING }
                    },
                    required: ["activity_name", "start_time", "end_time", "skill_targeted", "description", "materials"]
                }
            },
            parenting_tip: {
                type: Type.STRING,
                description: "A helpful tip for the parent."
            }
        },
        required: ["daily_plan", "parenting_tip"]
    };

    try {
         const response = await getAiClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        return response.text;
    } catch (error) {
        throw new ApiError("The AI assistant failed to generate a parenting plan. Please check your connection and try again.", error);
    }
};

export const geminiService = {
    generateMealPlan,
    generateSingleRecipe,
    getEmotionSupport,
    generateParentingPlan,
};