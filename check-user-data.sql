-- Check user data in both tables
-- Run this in your Supabase SQL Editor

-- Check auth.users table (this contains email and password)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- Check profiles table (this contains additional user info)
SELECT 
  id,
  full_name,
  role,
  location,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Join both tables to see complete user data
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  p.full_name,
  p.role,
  p.location,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
