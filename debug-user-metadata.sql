-- Debug script to check user metadata
-- Run this to see what's actually stored in user metadata

SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'role' as role_from_metadata,
    raw_user_meta_data->>'account_type' as account_type_from_metadata,
    raw_user_meta_data->>'full_name' as full_name_from_metadata,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check user_profiles table
SELECT 
    up.id,
    au.email,
    up.role as profile_role,
    up.full_name,
    au.raw_user_meta_data->>'role' as metadata_role,
    au.raw_user_meta_data->>'account_type' as metadata_account_type
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC
LIMIT 5;
