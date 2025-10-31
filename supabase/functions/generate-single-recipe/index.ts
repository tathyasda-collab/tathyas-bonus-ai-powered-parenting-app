import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface SingleRecipeRequest {
  dishName: string;
  language: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dishName, language }: SingleRecipeRequest = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

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
              dish_name: { type: "string" },
              description: { type: "string", description: "Detailed introduction about the dish" },
              prep_time: { type: "string", description: "Preparation time" },
              cook_time: { type: "string", description: "Cooking time" },
              total_time: { type: "string", description: "Total time needed" },
              servings: { type: "string", description: "Number of servings" },
              difficulty: { type: "string", description: "Difficulty level (Easy/Medium/Hard)" },
              ingredients: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    item: { type: "string", description: "Ingredient name with quantity" },
                    notes: { type: "string", description: "Optional notes about the ingredient" }
                  },
                  required: ["item"]
                }
              },
              instructions: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    step: { type: "number", description: "Step number" },
                    title: { type: "string", description: "Brief title for the step" },
                    instruction: { type: "string", description: "Detailed instruction" },
                    tip: { type: "string", description: "Optional cooking tip for this step" }
                  },
                  required: ["step", "instruction"]
                }
              },
              expert_tips: { type: "array", items: { type: "string" }, description: "Professional cooking tips" },
              variations: { type: "array", items: { type: "string" }, description: "Recipe variations or customizations" },
              nutritional_info: { type: "string", description: "Nutritional benefits or interesting facts" },
              storage_tips: { type: "string", description: "How to store leftovers" },
              shopping_list: { type: "array", items: { type: "string" }, description: "Organized shopping list" },
            },
            required: ["dish_name", "description", "ingredients", "instructions", "shopping_list"],
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
      JSON.stringify({ error: 'Failed to generate recipe' }),
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