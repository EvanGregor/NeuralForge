-- Confirm all users' emails at once
-- Run this in your Supabase SQL Editor

-- Update all users to confirm their emails
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Check the results
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC;
