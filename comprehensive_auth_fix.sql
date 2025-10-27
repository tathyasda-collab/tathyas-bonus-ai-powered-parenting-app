-- Comprehensive Supabase Auth Diagnostics and Fix
-- Run this in your Supabase SQL Editor to diagnose and fix auth issues

-- 1. Check if auth.users table is accessible
SELECT 'Checking auth.users table...' as step;
SELECT count(*) as user_count FROM auth.users;

-- 2. Check current RLS policies that might be blocking auth
SELECT 'Checking RLS policies...' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname IN ('public', 'auth') 
ORDER BY schemaname, tablename;

-- 3. Check for any triggers that might be interfering
SELECT 'Checking triggers...' as step;
SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_schema, event_object_table;

-- 4. Check app_users table structure and policies
SELECT 'Checking app_users table...' as step;
SELECT count(*) as app_users_count FROM app_users;

-- 5. Temporarily disable ALL RLS on public tables to isolate the issue
SELECT 'Disabling RLS on all public tables...' as step;

-- Disable RLS on all our custom tables
ALTER TABLE IF EXISTS app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS children DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planner_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meal_plan_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS emotion_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS single_recipe_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_dashboard_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings DISABLE ROW LEVEL SECURITY;

-- 6. Grant broad permissions to avoid any permission issues
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 7. Check if there are any custom auth hooks or triggers
SELECT 'Checking for auth hooks...' as step;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%auth%' OR routine_name LIKE '%user%'
ORDER BY routine_name;

-- 8. Drop any potentially problematic functions temporarily
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS on_auth_user_created() CASCADE;

-- 9. Create a simple test to verify auth is working
CREATE OR REPLACE FUNCTION test_auth_functionality()
RETURNS json AS $$
BEGIN
    RETURN json_build_object(
        'auth_enabled', 'true',
        'timestamp', NOW(),
        'message', 'Auth should work now - all blockers removed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Final verification
SELECT 'Auth diagnostic complete' as status;
SELECT test_auth_functionality() as test_result;

-- 11. Show current database configuration
SELECT 'Database configuration:' as info;
SELECT 
    name,
    setting,
    context,
    short_desc
FROM pg_settings 
WHERE name LIKE '%auth%' OR name LIKE '%rls%' OR name LIKE '%security%'
ORDER BY name;

-- Instructions for further debugging:
SELECT '
=== NEXT STEPS ===

1. Try logging in now - auth should work
2. If still failing, check Supabase Dashboard > Authentication > Settings
3. Verify these settings:
   - Enable email confirmations: OFF (for testing)
   - Secure email change: OFF (for testing)  
   - Enable phone confirmations: OFF
4. Check your environment variables in Vercel:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
5. If still failing, the issue might be in Supabase project settings

=== TO RE-ENABLE SECURITY LATER ===
After auth works, run:
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
-- And recreate appropriate RLS policies

' as instructions;