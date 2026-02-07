# Fix for Recruiter Role Not Being Saved

## Problem
When signing up as a "recruiter":
- ✅ Frontend redirects to `/recruiter/dashboard` (correct)
- ❌ Database saves role as "candidate" instead of "recruiter"

## Root Cause
The trigger function wasn't properly reading the `account_type` or `role` from user metadata. Possible issues:
1. Case sensitivity (e.g., "Recruiter" vs "recruiter")
2. NULL/empty string handling
3. Metadata field not being read correctly

## Solution

### Step 1: Debug Current State
First, check what's actually stored in the database:
```sql
-- Run debug-user-metadata.sql
-- This will show you what's in user metadata vs what's in user_profiles
```

### Step 2: Update Trigger Function
The trigger has been improved to:
- ✅ Handle case-insensitive role matching
- ✅ Properly check both 'role' and 'account_type' fields
- ✅ Trim whitespace from values
- ✅ Handle NULL and empty strings correctly
- ✅ Add warning logs for debugging

### Step 3: Run the Updated Fix
Run the updated `fix-signup-error-complete.sql` which includes:
- Better metadata reading logic
- Case-insensitive validation
- Proper NULL handling

## What Changed

### Before
```sql
v_raw_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'account_type'
);
```

### After
```sql
-- Check 'role' field first
IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND NEW.raw_user_meta_data->>'role' != '' THEN
    v_raw_role := LOWER(TRIM(NEW.raw_user_meta_data->>'role'));
-- Fallback to 'account_type' field
ELSIF NEW.raw_user_meta_data->>'account_type' IS NOT NULL AND NEW.raw_user_meta_data->>'account_type' != '' THEN
    v_raw_role := LOWER(TRIM(NEW.raw_user_meta_data->>'account_type'));
END IF;
```

## Testing Steps

1. **Check existing data**:
   ```sql
   -- Run debug-user-metadata.sql to see current state
   ```

2. **Update trigger**:
   ```sql
   -- Run fix-signup-error-complete.sql
   ```

3. **Test signup**:
   - Sign up as "recruiter"
   - Check Supabase → Authentication → Users
   - Check the user's `raw_user_meta_data` - should have `role: "recruiter"` and `account_type: "recruiter"`
   - Check Table Editor → user_profiles - should have `role: "recruiter"`

4. **Verify in code**:
   ```sql
   SELECT 
       au.email,
       au.raw_user_meta_data->>'role' as metadata_role,
       au.raw_user_meta_data->>'account_type' as metadata_account_type,
       up.role as profile_role
   FROM auth.users au
   LEFT JOIN user_profiles up ON au.id = up.id
   WHERE au.email = 'your-test-email@example.com';
   ```

## Fix Existing Users

If you have existing users with wrong roles:

```sql
-- Update based on their metadata
UPDATE user_profiles up
SET role = LOWER(TRIM(COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = up.id),
    (SELECT raw_user_meta_data->>'account_type' FROM auth.users WHERE id = up.id),
    'candidate'
)))
WHERE role != LOWER(TRIM(COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = up.id),
    (SELECT raw_user_meta_data->>'account_type' FROM auth.users WHERE id = up.id),
    'candidate'
)));
```

## Files Updated

1. ✅ `fix-signup-error-complete.sql` - Improved metadata reading
2. ✅ `fix-signup-trigger.sql` - Improved metadata reading
3. ✅ `debug-user-metadata.sql` - Debug script to check metadata

## Expected Behavior After Fix

- ✅ Signing up as "recruiter" → saves `role: "recruiter"` in database
- ✅ Signing up as "candidate" → saves `role: "candidate"` in database
- ✅ Frontend redirect matches database role
- ✅ Login uses correct role from database
