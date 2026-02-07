# Fix for Sign Out Button Not Working in Recruiter Dashboard

## Problem
The sign out button in the recruiter dashboard was not working - clicking it would sign out the user but wouldn't redirect them to the login page.

## Root Cause
1. The `signOut` function in `AuthContext.tsx` only called `supabase.auth.signOut()` but didn't redirect
2. The recruiter layout didn't have authentication protection/redirect logic
3. No loading state handling during sign out

## Solution Applied

### 1. Updated `signOut` Function (`contexts/AuthContext.tsx`)
- Added redirect to `/login` after signing out
- Uses `window.location.href` for a full page redirect (clears all state)

### 2. Updated Recruiter Layout (`app/recruiter/layout.tsx`)
- Added `useRouter` and `useEffect` for authentication check
- Added redirect to login if user is not authenticated
- Added loading state while checking authentication
- Made sign out button async to properly await the sign out

## Changes Made

### `contexts/AuthContext.tsx`
```typescript
const signOut = async () => {
  await supabase.auth.signOut()
  // Redirect to login page after sign out
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
```

### `app/recruiter/layout.tsx`
- Added imports: `useRouter`, `useEffect`
- Added auth check with redirect
- Added loading state
- Made sign out button async

## Testing

After the fix:
1. ✅ Click "Sign Out" button in recruiter dashboard
2. ✅ User should be signed out
3. ✅ User should be redirected to `/login` page
4. ✅ User should not be able to access recruiter pages without being logged in

## Files Modified

1. ✅ `contexts/AuthContext.tsx` - Added redirect to signOut function
2. ✅ `app/recruiter/layout.tsx` - Added auth protection and redirect logic

## Additional Benefits

- ✅ Recruiter pages are now protected (redirects to login if not authenticated)
- ✅ Loading state prevents flash of content before redirect
- ✅ Consistent behavior with other parts of the app
