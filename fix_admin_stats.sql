-- Fix Admin Statistics Database Queries
-- Run these queries in your Supabase SQL Editor to create proper admin statistics functions

-- 0. Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_admin_statistics();
DROP FUNCTION IF EXISTS get_renewal_url();
DROP FUNCTION IF EXISTS update_renewal_url(text);
DROP FUNCTION IF EXISTS get_expiring_users_csv();

-- 1. Create or replace the admin statistics view with correct calculations
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  COUNT(*) as registered_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_users,
  COUNT(CASE WHEN subscription_renewed = true THEN 1 END) as renewed_users,
  COUNT(CASE 
    WHEN subscription_expiry_date IS NOT NULL 
    AND subscription_expiry_date > NOW() 
    AND subscription_expiry_date <= NOW() + INTERVAL '7 days' 
    THEN 1 
  END) as expiring_soon
FROM app_users;

-- 2. Create function to get admin statistics with tool usage
CREATE OR REPLACE FUNCTION get_admin_statistics()
RETURNS json AS $$
DECLARE
  user_stats json;
  planner_stats json;
  meal_stats json;
  emotion_stats json;
  total_logs integer;
  result json;
BEGIN
  -- Get user statistics
  SELECT to_json(aus.*) INTO user_stats
  FROM admin_user_stats aus;
  
  -- Get planner statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'day', COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END),
    'month', COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
  ) INTO planner_stats
  FROM planner_runs;
  
  -- Get meal plan statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'day', COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END),
    'month', COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
  ) INTO meal_stats
  FROM meal_plan_runs;
  
  -- Get emotion log statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'day', COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END),
    'month', COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
  ) INTO emotion_stats
  FROM emotion_logs;
  
  -- Calculate total logs
  SELECT 
    COALESCE((planner_stats->>'total')::integer, 0) + 
    COALESCE((meal_stats->>'total')::integer, 0) + 
    COALESCE((emotion_stats->>'total')::integer, 0)
  INTO total_logs;
  
  -- Build final result
  result := json_build_object(
    'registeredUsers', COALESCE((user_stats->>'registered_users')::integer, 0),
    'activeUsers', COALESCE((user_stats->>'active_users')::integer, 0),
    'expiredUsers', COALESCE((user_stats->>'expired_users')::integer, 0),
    'renewedUsers', COALESCE((user_stats->>'renewed_users')::integer, 0),
    'expiringSoon', COALESCE((user_stats->>'expiring_soon')::integer, 0),
    'totalLogs', total_logs,
    'toolUsage', json_build_object(
      'planner', COALESCE(planner_stats, '{"total":0,"day":0,"month":0}'::json),
      'meal', COALESCE(meal_stats, '{"total":0,"day":0,"month":0}'::json),
      'emotion', COALESCE(emotion_stats, '{"total":0,"day":0,"month":0}'::json)
    ),
    'geminiCost', json_build_object(
      'total', 0,
      'month', 0,
      'day', 0
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to get renewal URL
CREATE OR REPLACE FUNCTION get_renewal_url()
RETURNS text AS $$
DECLARE
  url text;
BEGIN
  SELECT renewal_url INTO url FROM app_settings LIMIT 1;
  RETURN COALESCE(url, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to update renewal URL
CREATE OR REPLACE FUNCTION update_renewal_url(new_url text)
RETURNS boolean AS $$
BEGIN
  -- Update if exists, insert if not
  IF EXISTS (SELECT 1 FROM app_settings) THEN
    UPDATE app_settings SET renewal_url = new_url;
  ELSE
    INSERT INTO app_settings (renewal_url) VALUES (new_url);
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get expiring users CSV data
CREATE OR REPLACE FUNCTION get_expiring_users_csv()
RETURNS TABLE(
  email text,
  name text,
  phone text,
  expiry_date date,
  days_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.email,
    COALESCE(up.name, au.name) as name,
    up.phone,
    au.subscription_expiry_date::date as expiry_date,
    (au.subscription_expiry_date::date - CURRENT_DATE)::integer as days_remaining
  FROM app_users au
  LEFT JOIN user_profiles up ON au.user_id = up.user_id
  WHERE au.subscription_expiry_date IS NOT NULL
    AND au.subscription_expiry_date > CURRENT_DATE
    AND au.subscription_expiry_date <= CURRENT_DATE + INTERVAL '7 days'
  ORDER BY au.subscription_expiry_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure app_settings table exists
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  renewal_url text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- 7. Grant necessary permissions
-- These might need to be adjusted based on your RLS policies
-- GRANT SELECT ON admin_user_stats TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_admin_statistics() TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_renewal_url() TO authenticated;
-- GRANT EXECUTE ON FUNCTION update_renewal_url(text) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_expiring_users_csv() TO authenticated;

-- Test the functions
SELECT get_admin_statistics();