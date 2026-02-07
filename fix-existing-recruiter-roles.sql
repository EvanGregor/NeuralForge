-- Fix existing users who signed up as recruiter but have candidate role
-- Run this in Supabase SQL Editor

-- Update user_profiles based on auth.users metadata
UPDATE user_profiles up
SET role = CASE 
    -- Check 'role' field first
    WHEN LOWER(TRIM((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = up.id))) IN ('candidate', 'recruiter', 'admin')
    THEN LOWER(TRIM((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = up.id)))
    -- Fallback to 'account_type' field
    WHEN LOWER(TRIM((SELECT raw_user_meta_data->>'account_type' FROM auth.users WHERE id = up.id))) IN ('candidate', 'recruiter', 'admin')
    THEN LOWER(TRIM((SELECT raw_user_meta_data->>'account_type' FROM auth.users WHERE id = up.id)))
    -- Default to candidate if neither is valid
    ELSE 'candidate'
END
WHERE EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = up.id 
    AND (
        -- Only update if metadata has a different role than what's stored
        LOWER(TRIM(COALESCE(au.raw_user_meta_data->>'role', au.raw_user_meta_data->>'account_type', ''))) != up.role
        OR up.role IS NULL
    )
);

-- Show what was updated
SELECT 
    au.email,
    au.raw_user_meta_data->>'role' as metadata_role,
    au.raw_user_meta_data->>'account_type' as metadata_account_type,
    up.role as profile_role,
    CASE 
        WHEN up.role = LOWER(TRIM(COALESCE(au.raw_user_meta_data->>'role', au.raw_user_meta_data->>'account_type', 'candidate')))
        THEN '✓ Match'
        ELSE '✗ Mismatch'
    END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC
LIMIT 10;
