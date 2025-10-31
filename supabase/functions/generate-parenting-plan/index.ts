import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface Child {
  name: string;
  age: number;
}

interface PlanRequest {
  user: { fullName: string };
  child: Child;
  focusAreas: string;
  language: string;
  startTime?: string;
  endTime?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, child, focusAreas, language, startTime, endTime }: PlanRequest = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const timeRange = startTime && endTime ? ` between ${startTime} and ${endTime}` : '';
    const prompt = `Daily parenting plan for ${child.name} (${child.age} years). Parent: ${user.fullName}. Focus: ${focusAreas}.${timeRange ? ` Time: ${timeRange}.` : ''} Language: ${language}. Need structured plan with parenting tip.`;

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
              daily_plan: {
                type: "array",
                description: "A list of timed activities for the day.",
                items: {
                  type: "object",
                  properties: {
                    time: { type: "string", description: "Time of day (e.g., 8:00 AM)" },
                    activity: { type: "string", description: "Name of the activity" },
                    details: { type: "string", description: "Brief details about the activity" },
                  },
                  required: ["time", "activity", "details"],
                },
              },
              parenting_tip: {
                type: "string",
                description: "A single, helpful parenting tip.",
              },
            },
            required: ["daily_plan", "parenting_tip"],
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
      JSON.stringify({ error: 'Failed to generate parenting plan' }),
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