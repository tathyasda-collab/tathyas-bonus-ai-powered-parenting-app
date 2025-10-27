-- Update the existing admin_dashboard_stats table with correct data
-- Run this query in your Supabase SQL Editor to fix the admin dashboard stats table

-- First, let's see the current structure of admin_dashboard_stats table
-- (You can run this query first to check the table structure)
-- SELECT * FROM admin_dashboard_stats LIMIT 1;

-- Option 1: Update the existing record with correct data
UPDATE admin_dashboard_stats 
SET 
    active_users = (SELECT COUNT(*) FROM app_users WHERE status = 'active'),
    expired_users = (SELECT COUNT(*) FROM app_users WHERE status = 'expired'),
    renewed_users = (SELECT COUNT(*) FROM app_users WHERE subscription_renewed = true),
    expiring_soon = (
        SELECT COUNT(*) 
        FROM app_users 
        WHERE subscription_expiry_date IS NOT NULL 
        AND subscription_expiry_date > NOW() 
        AND subscription_expiry_date <= NOW() + INTERVAL '7 days'
    ),
    calculated_at = NOW()
WHERE idx = 0;

-- Option 2: Create a function to refresh the admin_dashboard_stats table
CREATE OR REPLACE FUNCTION refresh_admin_dashboard_stats()
RETURNS void AS $$
DECLARE
    stats_data json;
    planner_stats record;
    meal_stats record;
    emotion_stats record;
BEGIN
    -- Get the comprehensive stats from our function
    SELECT get_admin_statistics() INTO stats_data;
    
    -- Get detailed tool usage stats
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as day,
        COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month
    INTO planner_stats
    FROM planner_runs;
    
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as day,
        COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month
    INTO meal_stats
    FROM meal_plan_runs;
    
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as day,
        COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month
    INTO emotion_stats
    FROM emotion_logs;
    
    -- Update the admin_dashboard_stats table
    UPDATE admin_dashboard_stats 
    SET 
        registered_users = (stats_data->>'registeredUsers')::integer,
        active_users = (stats_data->>'activeUsers')::integer,
        expired_users = (stats_data->>'expiredUsers')::integer,
        renewed_users = (stats_data->>'renewedUsers')::integer,
        expiring_soon = (stats_data->>'expiringSoon')::integer,
        total_logs = (stats_data->>'totalLogs')::integer,
        logs_today = planner_stats.day + meal_stats.day + emotion_stats.day,
        logs_this_month = planner_stats.month + meal_stats.month + emotion_stats.month,
        planner_total = planner_stats.total,
        planner_day = planner_stats.day,
        planner_month = planner_stats.month,
        meal_total = meal_stats.total,
        meal_day = meal_stats.day,
        meal_month = meal_stats.month,
        emotion_total = emotion_stats.total,
        emotion_day = emotion_stats.day,
        emotion_month = emotion_stats.month,
        calculated_at = NOW()
    WHERE idx = 0;
    
    -- If no record exists, insert one
    IF NOT FOUND THEN
        INSERT INTO admin_dashboard_stats (
            idx, registered_users, active_users, expired_users, renewed_users, 
            expiring_soon, total_logs, logs_today, logs_this_month,
            planner_total, planner_day, planner_month,
            meal_total, meal_day, meal_month,
            emotion_total, emotion_day, emotion_month,
            gemini_cost_total_usd, gemini_cost_month_usd, gemini_cost_day_usd,
            gemini_cost_total, gemini_cost_month, gemini_cost_day,
            calculated_at
        ) VALUES (
            0,
            (stats_data->>'registeredUsers')::integer,
            (stats_data->>'activeUsers')::integer,
            (stats_data->>'expiredUsers')::integer,
            (stats_data->>'renewedUsers')::integer,
            (stats_data->>'expiringSoon')::integer,
            (stats_data->>'totalLogs')::integer,
            planner_stats.day + meal_stats.day + emotion_stats.day,
            planner_stats.month + meal_stats.month + emotion_stats.month,
            planner_stats.total,
            planner_stats.day,
            planner_stats.month,
            meal_stats.total,
            meal_stats.day,
            meal_stats.month,
            emotion_stats.total,
            emotion_stats.day,
            emotion_stats.month,
            '0.094480', -- Keep existing cost data or set to 0
            '0.080800',
            '0',
            '7.89',
            '6.75',
            '0.00',
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the refresh function to update the table immediately
SELECT refresh_admin_dashboard_stats();

-- Option 3: Create a trigger to auto-update the admin_dashboard_stats table
-- whenever data changes in the underlying tables (optional)
CREATE OR REPLACE FUNCTION trigger_refresh_admin_stats()
RETURNS trigger AS $$
BEGIN
    -- Call our refresh function
    PERFORM refresh_admin_dashboard_stats();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers on the main tables (optional - uncomment if you want auto-refresh)
-- DROP TRIGGER IF EXISTS refresh_stats_on_app_users ON app_users;
-- CREATE TRIGGER refresh_stats_on_app_users
--     AFTER INSERT OR UPDATE OR DELETE ON app_users
--     FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_admin_stats();

-- DROP TRIGGER IF EXISTS refresh_stats_on_planner_runs ON planner_runs;
-- CREATE TRIGGER refresh_stats_on_planner_runs
--     AFTER INSERT OR UPDATE OR DELETE ON planner_runs
--     FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_admin_stats();

-- DROP TRIGGER IF EXISTS refresh_stats_on_meal_plan_runs ON meal_plan_runs;
-- CREATE TRIGGER refresh_stats_on_meal_plan_runs
--     AFTER INSERT OR UPDATE OR DELETE ON meal_plan_runs
--     FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_admin_stats();

-- DROP TRIGGER IF EXISTS refresh_stats_on_emotion_logs ON emotion_logs;
-- CREATE TRIGGER refresh_stats_on_emotion_logs
--     AFTER INSERT OR UPDATE OR DELETE ON emotion_logs
--     FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_admin_stats();

-- Verify the update worked
SELECT * FROM admin_dashboard_stats WHERE idx = 0;