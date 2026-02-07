# Fix for Role Validation Error

## Problem
```
ERROR: 23514: new row for relation "user_profiles" violates check constraint "user_profiles_role_check"
DETAIL: Failing row contains (..., devops-engineer, ...)
```

The role value "devops-engineer" (or any other invalid value) doesn't match the check constraint which only allows:
- `'candidate'`
- `'recruiter'`
- `'admin'`

## Root Cause
The trigger function was accepting any role value from user metadata without validation. If someone signs up with an invalid role (like "devops-engineer"), it tries to insert it and fails.

## Solution

### Step 1: Fix Existing Invalid Roles
Run this to fix any existing users with invalid roles:
```sql
-- Run fix-invalid-roles.sql
```

### Step 2: Update the Trigger Function
The trigger function has been updated to:
1. ✅ Validate role values before inserting
2. ✅ Only allow: 'candidate', 'recruiter', 'admin'
3. ✅ Default to 'candidate' if role is invalid or missing
4. ✅ Handle both 'role' and 'account_type' fields

### Step 3: Run the Complete Fix
Run the updated `fix-signup-error-complete.sql` which includes:
- ✅ Role validation in trigger function
- ✅ Proper error handling
- ✅ Fixes for existing invalid roles

## What Changed

### Before
```sql
-- Would accept any role value
COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'account_type',
    'candidate'
)
```

### After
```sql
-- Validates and normalizes role
DECLARE
    v_role VARCHAR(20);
    v_raw_role TEXT;
BEGIN
    v_raw_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        NEW.raw_user_meta_data->>'account_type'
    );
    
    IF v_raw_role IN ('candidate', 'recruiter', 'admin') THEN
        v_role := v_raw_role;
    ELSE
        v_role := 'candidate'; -- Default for invalid values
    END IF;
    ...
```

## Quick Fix Steps

1. **Fix existing invalid roles**:
   ```sql
   UPDATE user_profiles
   SET role = 'candidate'
   WHERE role NOT IN ('candidate', 'recruiter', 'admin');
   ```

2. **Update trigger function**:
   - Run `fix-signup-error-complete.sql` (updated version)
   - OR run `fix-signup-trigger.sql` (updated version)

3. **Test signup**:
   - Try signing up again
   - Should work even with invalid role values (will default to 'candidate')

## Prevention

The trigger now validates all role values, so:
- ✅ Invalid roles are automatically converted to 'candidate'
- ✅ Users can still sign up successfully
- ✅ No more constraint violation errors

## Files Updated

1. ✅ `fix-signup-error-complete.sql` - Complete fix with role validation
2. ✅ `fix-signup-trigger.sql` - Trigger-only fix with role validation
3. ✅ `fix-invalid-roles.sql` - Script to fix existing invalid roles
