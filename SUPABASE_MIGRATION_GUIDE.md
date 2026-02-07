# Supabase Migration Guide for Hackathon

## Quick Start

This guide helps you migrate from localStorage to Supabase for production-ready hackathon deployment.

## Prerequisites

1. **Supabase Project Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings → API

2. **Environment Variables**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Database Schema**
   - Open Supabase SQL Editor
   - Run `database-schema.sql` to create all tables, RLS policies, and triggers

## Migration Steps

### Step 1: Verify Database Setup

```sql
-- In Supabase SQL Editor, verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should show: jobs, assessments, questions, submissions, answers, scores, user_profiles
```

### Step 2: Test Supabase Connection

```typescript
// In browser console or a test page:
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.from('jobs').select('count')
console.log('Connection test:', error ? 'Failed' : 'Success')
```

### Step 3: Migrate Existing Data (Optional)

If you have existing localStorage data:

```typescript
// In browser console:
import { runFullMigration } from '@/lib/migrationService'
import { useAuth } from '@/contexts/AuthContext'

// Get current user
const { user } = useAuth()
if (user) {
  const result = await runFullMigration(user.id)
  console.log('Migration result:', result)
}
```

Or create a migration page at `app/admin/migrate/page.tsx`:

```typescript
"use client"
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { runFullMigration, checkMigrationStatus } from '@/lib/migrationService'
import { Button } from '@/components/ui/button'

export default function MigratePage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleMigrate = async () => {
    if (!user) return
    setLoading(true)
    const result = await runFullMigration(user.id)
    setStatus(result)
    setLoading(false)
  }

  const handleCheck = async () => {
    const result = await checkMigrationStatus()
    setStatus(result)
  }

  return (
    <div className="p-8">
      <h1>Data Migration</h1>
      <Button onClick={handleCheck}>Check Status</Button>
      <Button onClick={handleMigrate} disabled={loading || !user}>
        {loading ? 'Migrating...' : 'Run Migration'}
      </Button>
      {status && <pre>{JSON.stringify(status, null, 2)}</pre>}
    </div>
  )
}
```

### Step 4: Update Code to Use Supabase Services

#### For Jobs/Assessments:

**Before (localStorage):**
```typescript
const jobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
```

**After (Supabase):**
```typescript
import { getJobsByRecruiter } from '@/lib/jobService'
const jobs = await getJobsByRecruiter(user.id)
```

#### For Submissions:

**Before (localStorage):**
```typescript
import { getAllSubmissions } from '@/lib/submissionService'
const submissions = getAllSubmissions()
```

**After (Supabase):**
```typescript
import { getAllSubmissions } from '@/lib/submissionServiceSupabase'
const submissions = await getAllSubmissions()
```

### Step 5: Update Key Files

#### 1. `app/recruiter/jobs/new/page.tsx`

Replace `handlePublish`:

```typescript
import { createJobWithAssessment } from '@/lib/jobService'

const handlePublish = async () => {
  if (!user) return
  
  const result = await createJobWithAssessment({
    title: parsedJD?.title || 'Untitled Assessment',
    company,
    description: jobDescription,
    parsed_skills: parsedJD?.skills || {},
    experience_level: parsedJD?.experience_level || 'fresher',
    responsibilities: parsedJD?.responsibilities || [],
    config,
    questions: generatedQuestions?.questions || [],
    recruiter_id: user.id,
    status: 'active'
  })

  if (result) {
    router.push('/recruiter/dashboard')
  } else {
    toast.error('Failed to create assessment')
  }
}
```

#### 2. `app/recruiter/dashboard/page.tsx`

Replace `loadJobs`:

```typescript
import { getJobsByRecruiter } from '@/lib/jobService'

useEffect(() => {
  const loadJobs = async () => {
    if (!user) return
    const recruiterJobs = await getJobsByRecruiter(user.id)
    setJobs(recruiterJobs)
    setLoading(false)
  }
  loadJobs()
}, [user])
```

#### 3. `lib/submissionService.ts`

Add Supabase fallback or replace entirely:

```typescript
// Option 1: Dual-write (recommended for gradual migration)
export async function saveSubmission(data: any) {
  // Try Supabase first
  const supabaseResult = await saveSubmissionSupabase(data)
  if (supabaseResult) {
    // Also save to localStorage as backup
    saveSubmissionLocalStorage(data)
    return supabaseResult
  }
  // Fallback to localStorage
  return saveSubmissionLocalStorage(data)
}

// Option 2: Full Supabase (after testing)
export const saveSubmission = saveSubmissionSupabase
```

#### 4. `app/test/[id]/assessment/page.tsx`

Update submission save:

```typescript
import { saveSubmission } from '@/lib/submissionServiceSupabase'

const handleSubmit = async () => {
  const result = await saveSubmission({
    assessmentId,
    candidateInfo,
    answers,
    antiCheatData: antiCheatRef.current,
    submittedAt: new Date().toISOString(),
    job: job
  })
  
  if (result) {
    router.push(`/test/${assessmentId}/submitted`)
  }
}
```

## Testing Checklist

- [ ] Create a new job/assessment → Verify in Supabase
- [ ] Take an assessment as candidate → Verify submission in Supabase
- [ ] View submissions in recruiter dashboard → Data loads from Supabase
- [ ] Check RLS policies → Recruiters only see their jobs
- [ ] Test migration script → localStorage data moved to Supabase

## Troubleshooting

### Error: "Row Level Security policy violation"
**Solution:** Check RLS policies in Supabase. Ensure:
- Recruiters can INSERT/UPDATE their own jobs
- Candidates can INSERT their own submissions
- Recruiters can SELECT submissions for their jobs

### Error: "Foreign key constraint violation"
**Solution:** Ensure parent records exist:
- Job must exist before assessment
- Assessment must exist before questions
- Submission must reference valid assessment_id

### Data not appearing after migration
**Solution:**
1. Check browser console for errors
2. Verify RLS policies allow your user to see data
3. Check Supabase logs in Dashboard → Logs

## Rollback Plan

If migration causes issues, you can temporarily revert:

```typescript
// Create a feature flag
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

export function getJobs() {
  return USE_SUPABASE 
    ? getJobsFromSupabase() 
    : getJobsFromLocalStorage()
}
```

## Performance Tips

1. **Use Indexes:** Already created in `database-schema.sql`
2. **Batch Queries:** Use `.select()` with joins instead of multiple queries
3. **Cache Results:** Consider React Query or SWR for client-side caching
4. **Pagination:** For large datasets, use `.range()` for pagination

## Next Steps

After successful migration:
1. Remove localStorage fallback code
2. Remove migration utilities
3. Update documentation
4. Deploy to production

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs
2. Verify environment variables
3. Test RLS policies in SQL Editor
4. Review error messages in browser console
