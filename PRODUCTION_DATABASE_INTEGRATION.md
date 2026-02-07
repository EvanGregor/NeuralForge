# Production Database Integration Guide

## Current State
- ✅ Database schema defined in `database-schema.sql`
- ✅ Supabase project configured
- ⚠️ Currently using localStorage for demo
- ⚠️ Need to migrate to Supabase database

## Migration Steps

### 1. **Set Up Supabase Database**

Run the schema in Supabase SQL Editor:
```sql
-- Execute database-schema.sql in Supabase
-- This creates all tables, RLS policies, and triggers
```

### 2. **Update Submission Service**

Replace localStorage with Supabase calls:

**Current:** `lib/submissionService.ts` uses `localStorage`
**Target:** Use Supabase `submissions` table

```typescript
// Example migration
import { supabase } from '@/lib/supabase'

export async function saveSubmission(submissionData: any) {
    // Instead of localStorage
    const { data, error } = await supabase
        .from('submissions')
        .insert({
            candidate_id: submissionData.candidateInfo.userId,
            assessment_id: submissionData.assessmentId,
            job_id: submissionData.job.id,
            resume_data: submissionData.resumeData,
            started_at: submissionData.candidateInfo.startedAt,
            submitted_at: submissionData.submittedAt,
            status: 'pending',
            anti_cheat_flags: submissionData.antiCheatData,
            plagiarism_data: submissionData.plagiarismData,
            bot_detection_data: submissionData.botDetectionData
        })
        .select()
        .single()
    
    // Save answers
    for (const [questionId, answer] of Object.entries(submissionData.answers)) {
        await supabase.from('answers').insert({
            submission_id: data.id,
            question_id: questionId,
            question_type: answer.question_type,
            response: answer.response,
            time_spent_seconds: answer.time_spent_seconds
        })
    }
    
    return data
}
```

### 3. **Update Job Storage**

Replace localStorage with Supabase:

**Current:** `assessai_jobs` in localStorage
**Target:** Use Supabase `jobs` and `assessments` tables

```typescript
// Save job/assessment
const { data, error } = await supabase
    .from('jobs')
    .insert({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        parsed_skills: jobData.parsed_skills,
        experience_level: jobData.experience_level,
        recruiter_id: user.id,
        is_active: jobData.status === 'active'
    })
    .select()
    .single()

// Save assessment
await supabase.from('assessments').insert({
    job_id: data.id,
    config: jobData.config,
    status: jobData.status
})

// Save questions
for (const question of jobData.questions) {
    await supabase.from('questions').insert({
        assessment_id: assessmentId,
        type: question.type,
        difficulty: question.difficulty,
        skill_tags: question.skill_tags,
        marks: question.marks,
        content: question.content,
        question_order: question.order
    })
}
```

### 4. **Update All Data Fetching**

Replace all `localStorage.getItem()` calls with Supabase queries:

```typescript
// Instead of:
const jobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')

// Use:
const { data: jobs } = await supabase
    .from('jobs')
    .select('*, assessments(*, questions(*))')
    .eq('is_active', true)
```

### 5. **Update RLS Policies**

Ensure Row Level Security is properly configured:

```sql
-- Recruiters can see all submissions for their jobs
CREATE POLICY "recruiters_view_submissions" ON submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = submissions.job_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

-- Candidates can see their own submissions
CREATE POLICY "candidates_view_own_submissions" ON submissions
    FOR SELECT
    USING (candidate_id = auth.uid());
```

### 6. **Migration Script**

Create a one-time migration script to move localStorage data to Supabase:

```typescript
// scripts/migrate-to-supabase.ts
async function migrateLocalStorageToSupabase() {
    // Read from localStorage
    const jobs = JSON.parse(localStorage.getItem('assessai_jobs') || '[]')
    const submissions = JSON.parse(localStorage.getItem('recruiter_submissions') || '[]')
    
    // Migrate jobs
    for (const job of jobs) {
        // Insert into Supabase
        // ...
    }
    
    // Migrate submissions
    for (const submission of submissions) {
        // Insert into Supabase
        // ...
    }
}
```

## Implementation Checklist

- [ ] Run `database-schema.sql` in Supabase
- [ ] Update `lib/submissionService.ts` to use Supabase
- [ ] Update `app/recruiter/jobs/new/page.tsx` to save to Supabase
- [ ] Update all pages that read from localStorage
- [ ] Create migration script for existing data
- [ ] Test RLS policies
- [ ] Update environment variables
- [ ] Remove localStorage dependencies

## Benefits

✅ **Scalability:** Handle thousands of submissions
✅ **Security:** Row-level security, encrypted data
✅ **Reliability:** Database backups, transactions
✅ **Performance:** Indexed queries, optimized
✅ **Multi-user:** Concurrent access support

## Notes

- Keep localStorage as fallback during migration
- Test thoroughly before removing localStorage
- Consider gradual migration (dual-write period)
- Backup localStorage data before migration
