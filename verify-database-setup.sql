-- Verification script to check if database is set up correctly
-- Run this in Supabase SQL Editor to diagnose issues

-- Check if user_profiles table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
        THEN '✓ user_profiles table exists'
        ELSE '✗ user_profiles table MISSING - Run database-schema.sql'
    END AS table_check;

-- Check if trigger exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_auth_user_created'
        )
        THEN '✓ Trigger exists'
        ELSE '✗ Trigger MISSING - Run fix-signup-trigger.sql'
    END AS trigger_check;

-- Check if function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'handle_new_user'
        )
        THEN '✓ Function exists'
        ELSE '✗ Function MISSING - Run fix-signup-trigger.sql'
    END AS function_check;

-- Check RLS policies
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND policyname = 'Users can insert own profile'
        )
        THEN '✓ RLS policy exists'
        ELSE '✗ RLS policy MISSING'
    END AS rls_check;

-- Show current trigger function code
SELECT 
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';
