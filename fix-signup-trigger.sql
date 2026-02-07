-- Fix for "Database error saving new user" issue
-- This script fixes the trigger to handle account_type from signup form
-- Run this in your Supabase SQL Editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved trigger function that handles account_type
-- Validates role to ensure it matches check constraint
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role VARCHAR(20);
    v_raw_role TEXT;
BEGIN
    -- Get role from metadata (check both 'role' and 'account_type')
    -- Prioritize 'role' field, then fallback to 'account_type'
    v_raw_role := NULL;
    
    -- Check 'role' field first
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND NEW.raw_user_meta_data->>'role' != '' THEN
        v_raw_role := LOWER(TRIM(NEW.raw_user_meta_data->>'role'));
    -- Fallback to 'account_type' field
    ELSIF NEW.raw_user_meta_data->>'account_type' IS NOT NULL AND NEW.raw_user_meta_data->>'account_type' != '' THEN
        v_raw_role := LOWER(TRIM(NEW.raw_user_meta_data->>'account_type'));
    END IF;
    
    -- Validate and normalize role value (case-insensitive)
    -- Only allow: 'candidate', 'recruiter', 'admin'
    -- Default to 'candidate' if invalid or missing
    IF v_raw_role IS NOT NULL AND v_raw_role IN ('candidate', 'recruiter', 'admin') THEN
        v_role := v_raw_role; -- Already lowercase
    ELSE
        -- If role is invalid or missing, default to 'candidate'
        v_role := 'candidate';
        -- Log warning if we had a value but it was invalid
        IF v_raw_role IS NOT NULL THEN
            RAISE WARNING 'Invalid role value "%" for user %, defaulting to candidate', v_raw_role, NEW.id;
        END IF;
    END IF;
    
    -- Insert into user_profiles table with validated role
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        v_role
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify the function was created
SELECT 'Trigger function created successfully' AS status;
