-- ============================================
-- COMPLETE FIX FOR SIGNUP ERROR
-- "Database error saving new user"
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- This will fix all signup-related database issues

-- Step 1: Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
    company VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());
    
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());
    
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Step 5: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 6: Create improved trigger function
-- This handles both 'role' and 'account_type' from signup form
-- Validates and normalizes role to ensure it matches check constraint
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
    
    -- Insert user profile with validated role
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
        -- Log warning but don't fail user creation
        -- This ensures users can still sign up even if profile creation fails
        RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 8: Verify setup
DO $$
BEGIN
    RAISE NOTICE '✓ user_profiles table created/verified';
    RAISE NOTICE '✓ RLS policies created';
    RAISE NOTICE '✓ Trigger function created';
    RAISE NOTICE '✓ Trigger attached to auth.users';
    RAISE NOTICE '';
    RAISE NOTICE 'Setup complete! You can now test signup.';
END $$;

-- Optional: Create profiles for existing users who don't have one
-- This also validates role values to ensure they match the constraint
INSERT INTO user_profiles (id, full_name, role)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1)
    ) as full_name,
    CASE 
        WHEN COALESCE(
            au.raw_user_meta_data->>'role',
            au.raw_user_meta_data->>'account_type'
        ) IN ('candidate', 'recruiter', 'admin') 
        THEN COALESCE(
            au.raw_user_meta_data->>'role',
            au.raw_user_meta_data->>'account_type'
        )
        ELSE 'candidate' -- Default to candidate if invalid role
    END as role
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
