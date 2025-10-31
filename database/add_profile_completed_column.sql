-- Add profile_completed column to track if users have completed their first-time setup
-- This helps determine if new users should go through the profile setup flow

-- Add the profile_completed column if it doesn't exist
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have profile_completed = true if they have a proper name
-- (assuming users with real names have already set up their profiles)
UPDATE app_users 
SET profile_completed = TRUE 
WHERE name IS NOT NULL 
  AND name != '' 
  AND name != SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)
  AND LENGTH(name) > 2;

-- Update admin users to have profile_completed = true by default
UPDATE app_users 
SET profile_completed = TRUE 
WHERE role = 'admin';

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_app_users_profile_completed ON app_users(profile_completed);

-- Add a comment to document the column
COMMENT ON COLUMN app_users.profile_completed IS 'Tracks whether user has completed their first-time profile setup';

-- Create a function to automatically mark new admin users as profile_completed
CREATE OR REPLACE FUNCTION mark_admin_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is being set as admin, mark profile as completed
  IF NEW.role = 'admin' THEN
    NEW.profile_completed = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically mark admin users as profile_completed
DROP TRIGGER IF EXISTS trigger_mark_admin_profile_completed ON app_users;
CREATE TRIGGER trigger_mark_admin_profile_completed
  BEFORE INSERT OR UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION mark_admin_profile_completed();

-- Grant permissions
GRANT SELECT, UPDATE ON app_users TO anon, authenticated;