# Fix: Candidate Test Data Not Showing

## Problem
Candidate test submissions were not appearing in the recruiter Candidates page.

## Root Cause
Submissions were being saved to `sessionStorage` (candidate side) but not being collected into `localStorage` (recruiter side) properly.

## Solution Applied

### 1. **Migration Function** (`lib/submissionService.ts`)
Added `migrateSubmissionsFromSessionStorage()` function that:
- ✅ Scans all sessionStorage keys starting with `submission_`
- ✅ Validates submission data
- ✅ Migrates to localStorage if not already present
- ✅ Evaluates submissions if questions are available
- ✅ Prevents duplicates

### 2. **Automatic Migration** (`app/recruiter/candidates/page.tsx`)
- ✅ Automatically runs migration on page load
- ✅ Collects any existing submissions from sessionStorage
- ✅ Logs migration count to console

### 3. **Manual Sync Button**
- ✅ "Sync Submissions" button in Candidates page
- ✅ Manually trigger migration
- ✅ Shows toast notification with count

### 4. **Better Error Handling** (`app/test/[id]/assessment/page.tsx`)
- ✅ Validates candidate info before saving
- ✅ Validates job info before saving
- ✅ Better error logging
- ✅ Console logs for debugging

### 5. **Debug Utility** (`lib/submissionDebug.ts`)
- ✅ `debugSubmissions()` function
- ✅ Shows all localStorage and sessionStorage data
- ✅ Available in browser console as `window.debugSubmissions()`
- ✅ Debug button in Candidates page

## How to Use

### For New Submissions:
1. Candidate completes assessment
2. Submits assessment
3. Data automatically saved to both:
   - `sessionStorage` (for candidate)
   - `localStorage` (for recruiter)
4. Appears in Candidates page immediately

### For Existing Submissions:
1. Go to `/recruiter/candidates`
2. Click "Sync Submissions" button
3. System will collect any submissions from sessionStorage
4. Toast notification shows count of migrated submissions

### For Debugging:
1. Open browser console
2. Run: `debugSubmissions()`
   - OR click "Debug" button in Candidates page
3. Check console output for:
   - localStorage submissions
   - sessionStorage submissions
   - Candidate info
   - Answers
   - Jobs

## Data Flow

```
Candidate Submits Assessment
    ↓
handleSubmit() called
    ↓
Validates data (candidate info, job info)
    ↓
saveSubmission() → localStorage
    ↓
evaluateAndSaveSubmission() → Calculate scores
    ↓
updateSubmissionScores() → Save scores
    ↓
updateJobCandidateCount() → Update job stats
    ↓
Data visible in Candidates page
```

## Migration Flow

```
Recruiter Opens Candidates Page
    ↓
migrateSubmissionsFromSessionStorage() runs
    ↓
Scans sessionStorage for submission_* keys
    ↓
Validates each submission
    ↓
Checks if already in localStorage
    ↓
Saves to localStorage if new
    ↓
Evaluates if questions available
    ↓
Updates job candidate counts
    ↓
Candidates page shows all submissions
```

## Testing

### Test New Submission:
1. **As Candidate:**
   - Complete an assessment
   - Submit it
   - Check browser console for "Submission saved" log

2. **As Recruiter:**
   - Go to `/recruiter/candidates`
   - Should see the submission immediately
   - Check stats cards for updated counts

### Test Migration:
1. **Check sessionStorage:**
   - Open browser console
   - Run: `Object.keys(sessionStorage).filter(k => k.startsWith('submission_'))`
   - Should see submission keys

2. **Run Migration:**
   - Go to `/recruiter/candidates`
   - Click "Sync Submissions" button
   - Check toast notification

3. **Verify:**
   - Check localStorage: `localStorage.getItem('recruiter_submissions')`
   - Should see submissions in JSON format

### Test Debug:
1. Open browser console
2. Run: `debugSubmissions()`
3. Check output for:
   - All submission data
   - Candidate info
   - Answers
   - Jobs

## Common Issues

### Issue: Submissions not showing
**Solution:**
1. Click "Sync Submissions" button
2. Check browser console for errors
3. Run `debugSubmissions()` to see data
4. Verify submission has required fields:
   - `candidateInfo.name`
   - `candidateInfo.email`
   - `job.id`
   - `job.title`
   - `answers`

### Issue: Scores not calculated
**Solution:**
1. Verify job has `questions` array
2. Check console for "No questions available" warning
3. Ensure questions have `id`, `type`, `marks`, `content`

### Issue: Duplicate submissions
**Solution:**
- Migration checks for duplicates by `assessmentId + email`
- Existing submissions are updated, not duplicated

## Data Structure

### Submission in sessionStorage:
```json
{
  "assessmentId": "uuid",
  "candidateInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "startedAt": "2024-01-01T00:00:00Z"
  },
  "answers": {
    "question-id-1": {
      "question_id": "question-id-1",
      "question_type": "mcq",
      "response": { "selected_option": 0 },
      "time_spent_seconds": 30
    }
  },
  "antiCheatData": {
    "tab_switches": 0,
    "copy_paste_detected": false
  },
  "submittedAt": "2024-01-01T00:00:00Z",
  "job": {
    "id": "job-uuid",
    "title": "Full Stack Developer",
    "company": "TechCorp",
    "questions": [...]
  }
}
```

### Submission in localStorage (recruiter_submissions):
```json
[
  {
    "id": "assessmentId_email_timestamp",
    "assessmentId": "uuid",
    "jobId": "job-uuid",
    "jobTitle": "Full Stack Developer",
    "company": "TechCorp",
    "candidateInfo": {...},
    "answers": {...},
    "antiCheatData": {...},
    "submittedAt": "2024-01-01T00:00:00Z",
    "status": "evaluated",
    "scores": {
      "totalScore": 85,
      "totalPossible": 100,
      "percentage": 85,
      "sectionScores": {...},
      "skillScores": {...}
    }
  }
]
```

## Next Steps

- ✅ Data collection working
- ✅ Migration working
- ✅ Debug tools available
- ⏭️ Can proceed with Phase 3 (Detail Page) or Phase 4 (Analytics)
