-- Fix existing users with invalid role values
-- This updates any user_profiles with invalid roles to 'candidate'
-- Run this in Supabase SQL Editor

-- Update invalid roles to 'candidate'
UPDATE user_profiles
SET role = 'candidate'
WHERE role NOT IN ('candidate', 'recruiter', 'admin');

-- Show what was fixed
SELECT 
    id,
    full_name,
    role,
    created_at
FROM user_profiles
WHERE role = 'candidate'
ORDER BY created_at DESC
LIMIT 10;

-- Verify all roles are now valid
SELECT 
    role,
    COUNT(*) as count
FROM user_profiles
GROUP BY role;
