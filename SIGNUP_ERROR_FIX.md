# Fix for "Database error saving new user" Error

## Problem
When signing up, you get this error:
```
Database error saving new user
at async signUp (contexts\AuthContext.tsx:79:29)
```

## Root Cause
The database trigger that auto-creates user profiles has issues:
1. **Field mismatch**: Signup form sends `account_type` but trigger looks for `role`
2. **Missing error handling**: Trigger doesn't handle edge cases gracefully
3. **Possible missing table**: `user_profiles` table might not exist

## Solution

### Step 1: Verify Database Setup
Run this in Supabase SQL Editor to check what's missing:
```sql
-- Run verify-database-setup.sql
```

### Step 2: Fix the Trigger
Run this in Supabase SQL Editor:
```sql
-- Run fix-signup-trigger.sql
```

This will:
- ✅ Fix the trigger to handle both `account_type` and `role`
- ✅ Add error handling so user creation doesn't fail
- ✅ Add `ON CONFLICT` handling to prevent duplicate errors

### Step 3: Ensure Table Exists
If the `user_profiles` table doesn't exist, run:
```sql
-- Run database-schema.sql (the full schema)
-- OR just create the table:
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
    company VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());
    
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());
    
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());
```

### Step 4: Test Signup
1. Go to `/signup`
2. Fill in the form
3. Submit
4. Check Supabase dashboard → Authentication → Users
5. Check Supabase dashboard → Table Editor → user_profiles

## Quick Fix (All-in-One Script)

If you want to fix everything at once, run this in Supabase SQL Editor:

```sql
-- Ensure table exists
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
    company VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());
    
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());
    
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Fix trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'role',
            NEW.raw_user_meta_data->>'account_type',
            'candidate'
        )
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## What Changed

### In Code
- ✅ Updated `app/signup/page.tsx` to send both `account_type` and `role` in metadata

### In Database
- ✅ Trigger now handles both `account_type` and `role` fields
- ✅ Added error handling so user creation doesn't fail if profile creation fails
- ✅ Added `ON CONFLICT` handling to prevent duplicate errors

## Testing

After running the fix:

1. **Test Signup**:
   - Go to `/signup`
   - Create a new account
   - Should redirect to dashboard without errors

2. **Verify in Supabase**:
   - Authentication → Users: Should see new user
   - Table Editor → user_profiles: Should see new profile row

3. **Check Console**:
   - No "Database error saving new user" error
   - User should be logged in

## Still Having Issues?

If you still get errors:

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for error messages

2. **Verify Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Check Table Exists**:
   ```sql
   SELECT * FROM user_profiles LIMIT 1;
   ```

4. **Check Trigger Exists**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
