import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface Child {
  name: string;
  age: number;
}

interface MealPlanRequest {
  child: Child;
  dietaryPreferences: string[];
  language: string;
  motherAge?: number;
  additionalInstructions?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { child, dietaryPreferences, language, motherAge, additionalInstructions }: MealPlanRequest = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const motherText = motherAge ? ` and mother (age ${motherAge})` : '';
    const instructionsText = additionalInstructions ? ` Additional instructions: ${additionalInstructions}.` : '';
    
    const prompt = `1-day meal plan for ${child.name} (${child.age} months old)${motherText}. Dietary: ${dietaryPreferences.join(', ') || 'None'}.${instructionsText} Include baby & mother meals for breakfast/lunch/dinner/snack with ingredients and shopping_list. Language: ${language}.`;

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              breakfast: {
                type: "object",
                properties: {
                  baby: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  },
                  mother: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  }
                },
                required: ["baby", "mother"]
              },
              lunch: {
                type: "object",
                properties: {
                  baby: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  },
                  mother: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  }
                },
                required: ["baby", "mother"]
              },
              dinner: {
                type: "object",
                properties: {
                  baby: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  },
                  mother: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  }
                },
                required: ["baby", "mother"]
              },
              snack: {
                type: "object",
                properties: {
                  baby: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  },
                  mother: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                      recipe: { type: "string" }
                    },
                    required: ["name", "ingredients"]
                  }
                },
                required: ["baby", "mother"]
              },
              shopping_list: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["breakfast", "lunch", "dinner", "snack", "shopping_list"],
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text
    const result = JSON.parse(content)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate meal plan' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
  }
})