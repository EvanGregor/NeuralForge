# Fix: Auto-fill User Info & Redirect After Assessment

## Problem
1. Logged-in candidates were still asked for name and email (should be auto-filled)
2. After assessment completion, candidates were redirected to landing page instead of dashboard

## Solution Applied

### 1. Auto-fill Name & Email for Logged-in Users

#### Assessment Link Page (`app/test/[id]/page.tsx`)
- ✅ Checks if user is logged in
- ✅ If logged in with name/email → **skips info page** and goes directly to assessment
- ✅ Auto-creates candidate info from user account
- ✅ If not logged in → goes to info page as before

#### Info Page (`app/test/[id]/info/page.tsx`)
- ✅ Auto-fills name and email from user account if logged in
- ✅ Shows different message for logged-in users
- ✅ Users can still edit the auto-filled info if needed
- ✅ Resume upload still optional

#### Assessment Page (`app/test/[id]/assessment/page.tsx`)
- ✅ If user is logged in but no candidate info exists → auto-creates it
- ✅ Prevents redirect loop for logged-in users

### 2. Fixed Redirect After Submission

#### Submitted Page (`app/test/[id]/submitted/page.tsx`)
- ✅ Checks if user is logged in
- ✅ **If logged in** → Shows "Go to Dashboard" button → redirects to `/candidate/dashboard`
- ✅ **If not logged in** → Shows "Go to Homepage" button → redirects to `/`
- ✅ Different message based on login status

## Flow Changes

### Before:
```
Logged-in User:
  /test/[id] → /test/[id]/info (asks for name/email) → /test/[id]/assessment → /test/[id]/submitted → Landing Page ❌
```

### After:
```
Logged-in User:
  /test/[id] → /test/[id]/assessment (auto-fills info) → /test/[id]/submitted → Dashboard ✅

Not Logged-in User:
  /test/[id] → /test/[id]/info (enter details) → /test/[id]/assessment → /test/[id]/submitted → Homepage ✅
```

## Features Added

### For Logged-in Users:
1. **Auto-fill from Account:**
   - Name from `user.user_metadata.full_name` or `user.user_metadata.name` or email prefix
   - Email from `user.email`
   - User ID stored for tracking

2. **Skip Info Page:**
   - If user has name and email → goes directly to assessment
   - Saves time and reduces friction

3. **Smart Redirect:**
   - After submission → redirects to candidate dashboard
   - Can view all their assessments in one place

### For Non-logged-in Users:
- Still works as before (hackathon-friendly)
- Can enter details manually
- Redirects to homepage after submission

## Data Structure

### Candidate Info (Logged-in User):
```typescript
{
  name: string,        // From user_metadata.full_name or email prefix
  email: string,       // From user.email
  assessmentId: string,
  startedAt: string,
  userId: string      // NEW: User ID for logged-in users
}
```

## Testing

### As Logged-in Candidate:
1. Go to `/test/[assessmentId]`
2. Click "Start Assessment"
3. ✅ Should skip info page and go directly to assessment
4. Complete assessment
5. Submit
6. ✅ Should redirect to `/candidate/dashboard` (not landing page)

### As Non-logged-in Candidate:
1. Go to `/test/[assessmentId]`
2. Click "Start Assessment"
3. ✅ Should go to info page
4. Enter details and continue
5. Complete assessment
6. Submit
7. ✅ Should redirect to homepage

## Files Modified

1. ✅ `app/test/[id]/page.tsx` - Auto-skip info page for logged-in users
2. ✅ `app/test/[id]/info/page.tsx` - Auto-fill name/email from account
3. ✅ `app/test/[id]/assessment/page.tsx` - Auto-create info for logged-in users
4. ✅ `app/test/[id]/submitted/page.tsx` - Smart redirect based on login status

## Benefits

✅ **Better UX for Logged-in Users:**
- No redundant data entry
- Faster assessment start
- Proper redirect to dashboard

✅ **Still Works for Non-logged-in:**
- Hackathon-friendly flow maintained
- No breaking changes

✅ **Flexible:**
- Logged-in users can still edit auto-filled info if needed
- Resume upload still optional for everyone
