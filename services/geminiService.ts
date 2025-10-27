
import { GoogleGenAI, Type } from '@google/genai';
import type { Child, PlannerRun, MealPlanRun, SingleRecipeRun } from '../types';
import { ApiError } from '../types';


let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) {
    return aiClient;
  }
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please check your environment variables.");
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export async function generateParentingPlan(
  user: { fullName: string },
  child: Child,
  focusAreas: string,
  language: string,
  startTime?: string,
  endTime?: string
): Promise<{ daily_plan: { time: string; activity: string; details: string }[]; parenting_tip: string }> {
  try {
    const ai = getAiClient();
    const timeRange = startTime && endTime ? ` between ${startTime} and ${endTime}` : '';
    const prompt = `Daily parenting plan for ${child.name} (${child.age} years). Parent: ${user.fullName}. Focus: ${focusAreas}.${timeRange ? ` Time: ${timeRange}.` : ''} Language: ${language}. Need structured plan with parenting tip.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Use latest faster model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            daily_plan: {
              type: Type.ARRAY,
              description: "A list of timed activities for the day.",
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "Time of day (e.g., 8:00 AM)" },
                  activity: { type: Type.STRING, description: "Name of the activity" },
                  details: { type: Type.STRING, description: "Brief details about the activity" },
                },
                required: ["time", "activity", "details"],
              },
            },
            parenting_tip: {
              type: Type.STRING,
              description: "A single, helpful parenting tip.",
            },
          },
          required: ["daily_plan", "parenting_tip"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
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
    const ai = getAiClient();
    const motherText = motherAge ? ` and mother (age ${motherAge})` : '';
    const instructionsText = additionalInstructions ? ` Additional instructions: ${additionalInstructions}.` : '';
    
    const prompt = `1-day meal plan for ${child.name} (${child.age} months old)${motherText}. Dietary: ${dietaryPreferences.join(', ') || 'None'}.${instructionsText} Include baby & mother meals for breakfast/lunch/dinner/snack with ingredients and shopping_list. Language: ${language}.`;

    console.log('generateMealPlan prompt:', prompt);
    console.log('Making API call to Gemini...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Use faster model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: {
              type: Type.OBJECT,
              properties: {
                baby: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                },
                mother: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                }
              },
              required: ["baby", "mother"]
            },
            lunch: {
              type: Type.OBJECT,
              properties: {
                baby: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                },
                mother: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                }
              },
              required: ["baby", "mother"]
            },
            dinner: {
              type: Type.OBJECT,
              properties: {
                baby: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                },
                mother: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                }
              },
              required: ["baby", "mother"]
            },
            snack: {
              type: Type.OBJECT,
              properties: {
                baby: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                },
                mother: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recipe: { type: Type.STRING }
                  },
                  required: ["name", "ingredients"]
                }
              },
              required: ["baby", "mother"]
            },
            shopping_list: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["breakfast", "lunch", "dinner", "snack", "shopping_list"],
        },
      },
    });

    console.log('Gemini API response received successfully');
    const result = JSON.parse(response.text);
    console.log('Parsed result:', result);
    return result;
  } catch (error) {
    console.error('generateMealPlan error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    throw new ApiError("Failed to generate the meal plan. Please try again.");
  }
}

export async function generateSingleRecipe(
  dishName: string,
  language: string
): Promise<SingleRecipeRun['result']> {
    try {
        const ai = getAiClient();
        const prompt = `Create a comprehensive, detailed recipe for "${dishName}" that is family-friendly and suitable for parents with children. 

REQUIREMENTS:
- Write in ${language} language
- Include a detailed description/introduction about the dish
- Provide complete ingredient list with exact measurements
- Give step-by-step cooking instructions with detailed explanations
- Include cooking tips and expert advice
- Add nutritional benefits or interesting facts
- Suggest variations or customizations
- Provide proper cooking times and temperatures
- Make it engaging and educational for parents

FORMAT: Create a professional recipe format similar to food blogs, with rich detail and helpful context for each step. The recipe should be comprehensive enough that even a beginner cook can follow it successfully.

EXAMPLE STYLE: Like detailed food blog recipes with introduction, ingredients, step-by-step instructions, tips, and variations.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dish_name: { type: Type.STRING },
                        description: { type: Type.STRING, description: "Detailed introduction about the dish" },
                        prep_time: { type: Type.STRING, description: "Preparation time" },
                        cook_time: { type: Type.STRING, description: "Cooking time" },
                        total_time: { type: Type.STRING, description: "Total time needed" },
                        servings: { type: Type.STRING, description: "Number of servings" },
                        difficulty: { type: Type.STRING, description: "Difficulty level (Easy/Medium/Hard)" },
                        ingredients: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    item: { type: Type.STRING, description: "Ingredient name with quantity" },
                                    notes: { type: Type.STRING, description: "Optional notes about the ingredient" }
                                },
                                required: ["item"]
                            }
                        },
                        instructions: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    step: { type: Type.NUMBER, description: "Step number" },
                                    title: { type: Type.STRING, description: "Brief title for the step" },
                                    instruction: { type: Type.STRING, description: "Detailed instruction" },
                                    tip: { type: Type.STRING, description: "Optional cooking tip for this step" }
                                },
                                required: ["step", "instruction"]
                            }
                        },
                        expert_tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Professional cooking tips" },
                        variations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recipe variations or customizations" },
                        nutritional_info: { type: Type.STRING, description: "Nutritional benefits or interesting facts" },
                        storage_tips: { type: Type.STRING, description: "How to store leftovers" },
                        shopping_list: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Organized shopping list" },
                    },
                    required: ["dish_name", "description", "ingredients", "instructions", "shopping_list"],
                },
            },
        });
        
        return JSON.parse(response.text);
    } catch (error) {
        console.error('generateSingleRecipe error:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
          cause: error?.cause
        });
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
    const ai = getAiClient();
    const namePrefix = userName ? `${userName}, ` : '';
    const prompt = `Write a direct, supportive message to a parent feeling "${mood}".${note ? ` Context: "${note}".` : ''} Address them directly${userName ? ` using their name "${userName}"` : ''}, not as instructions to deliver a message. Include: 1) personal validation of their feelings, 2) direct encouraging words (max 150 words), 3) actionable advice they can try. Write in ${language}. Start with "${namePrefix}" and speak directly to them as their supportive parenting coach.`;
      
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    throw new ApiError("Failed to get emotional support. Please try again.");
  }
}