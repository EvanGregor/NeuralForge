-- Manually create profiles for existing users
-- Run this in your Supabase SQL Editor

-- Create profiles for users who don't have them
INSERT INTO profiles (id, full_name, role, location)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
  COALESCE(au.raw_user_meta_data->>'role', 'Developer') as role,
  COALESCE(au.raw_user_meta_data->>'location', 'Unknown') as location
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Check the results
SELECT 
  au.email,
  p.full_name,
  p.role,
  p.location
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
