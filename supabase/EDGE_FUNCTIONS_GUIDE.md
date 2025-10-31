# Supabase Edge Functions Security Implementation

## Overview

This project has been migrated from client-side Gemini API calls to secure server-side Supabase Edge Functions. This ensures the Gemini API key is never exposed to frontend users.

## Edge Functions

### 1. `generate-parenting-plan`
- **Endpoint**: `/functions/v1/generate-parenting-plan`
- **Purpose**: Generate daily parenting plans using Gemini AI
- **Input**: user info, child details, focus areas, language, time range
- **Output**: structured daily plan with activities and parenting tip

### 2. `generate-meal-plan`
- **Endpoint**: `/functions/v1/generate-meal-plan`
- **Purpose**: Generate meal plans for baby and mother
- **Input**: child details, dietary preferences, language, additional instructions
- **Output**: complete meal plan with breakfast/lunch/dinner/snack and shopping list

### 3. `generate-single-recipe`
- **Endpoint**: `/functions/v1/generate-single-recipe`
- **Purpose**: Generate detailed recipes for specific dishes
- **Input**: dish name, language
- **Output**: comprehensive recipe with ingredients, instructions, tips, and variations

### 4. `get-emotion-support`
- **Endpoint**: `/functions/v1/get-emotion-support`
- **Purpose**: Provide emotional support and guidance for parents
- **Input**: mood, optional note, language, optional user name
- **Output**: personalized supportive message

## Deployment

### Prerequisites
1. **Supabase CLI**: Install with `npm install -g supabase`
2. **Supabase Project**: Must have active Supabase project
3. **Gemini API Key**: Must be configured as secret in Supabase

### Steps to Deploy

1. **Login to Supabase**:
   ```bash
   supabase login
   ```

2. **Link to your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Set the Gemini API Key as secret**:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key
   ```

4. **Deploy all functions**:
   ```bash
   supabase functions deploy
   ```

   Or deploy individually:
   ```bash
   supabase functions deploy generate-parenting-plan
   supabase functions deploy generate-meal-plan
   supabase functions deploy generate-single-recipe
   supabase functions deploy get-emotion-support
   ```

5. **Verify deployment**:
   ```bash
   supabase functions list
   ```

## Security Benefits

✅ **API Key Protection**: Gemini API key stored securely on server-side
✅ **No Client Exposure**: API key never sent to frontend
✅ **Controlled Access**: Functions run in secure Supabase environment
✅ **CORS Configuration**: Proper CORS headers for web app access
✅ **Error Handling**: Graceful error responses without exposing internals

## Frontend Integration

The frontend `geminiService.ts` has been updated to:
- Remove direct Gemini API imports
- Use fetch calls to Supabase Edge Functions
- Maintain same function signatures for seamless integration
- Use Supabase URL and anonymous key for authentication

## Environment Variables

### Frontend (.env.production)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://bonusaiapp.tathyas.in
```

### Supabase Secrets (server-side)
```bash
GEMINI_API_KEY=your_actual_gemini_api_key
```

## Testing

Test each function individually:

```bash
# Test parenting plan
curl -X POST https://your-project.supabase.co/functions/v1/generate-parenting-plan \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user":{"fullName":"Test Parent"},"child":{"name":"Test Child","age":3},"focusAreas":"learning","language":"English"}'

# Test meal plan
curl -X POST https://your-project.supabase.co/functions/v1/generate-meal-plan \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"child":{"name":"Test Baby","age":12},"dietaryPreferences":[],"language":"English"}'
```

## Troubleshooting

1. **Function not found**: Ensure functions are deployed successfully
2. **API key errors**: Verify GEMINI_API_KEY secret is set correctly
3. **CORS issues**: Check if domain is allowed in Supabase dashboard
4. **Auth errors**: Ensure VITE_SUPABASE_ANON_KEY is correct

## Cost Optimization

- Functions only run when called (no idle costs)
- Gemini API usage remains the same
- Supabase Edge Functions have generous free tier
- No additional infrastructure costs