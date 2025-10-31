import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface EmotionSupportRequest {
  mood: string;
  note?: string;
  language: string;
  userName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mood, note, language, userName }: EmotionSupportRequest = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const namePrefix = userName ? `${userName}, ` : '';
    const prompt = `Write a direct, supportive message to a parent feeling "${mood}".${note ? ` Context: "${note}".` : ''} Address them directly${userName ? ` using their name "${userName}"` : ''}, not as instructions to deliver a message. Include: 1) personal validation of their feelings, 2) direct encouraging words (max 150 words), 3) actionable advice they can try. Write in ${language}. Start with "${namePrefix}" and speak directly to them as their supportive parenting coach.`;

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
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    return new Response(
      JSON.stringify({ message: content }),
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
      JSON.stringify({ error: 'Failed to get emotional support' }),
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