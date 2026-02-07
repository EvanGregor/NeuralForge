# localStorage to Supabase Migration Analysis

## Overview
This document analyzes all localStorage usage in the AssessAI codebase and provides a migration plan to Supabase for hackathon production readiness.

## Current localStorage Usage

### 1. **Jobs/Assessments Storage** (`assessai_jobs`)
**Location:** Multiple files
**Purpose:** Store recruiter-created job assessments with questions

**Files Using:**
- `app/recruiter/jobs/new/page.tsx` - Creates and saves jobs
- `app/recruiter/dashboard/page.tsx` - Lists all jobs
- `app/recruiter/jobs/[id]/edit/page.tsx` - Edits jobs
- `app/recruiter/jobs/[id]/leaderboard/page.tsx` - Views job leaderboard
- `app/candidate/dashboard/page.tsx` - Shows available assessments
- `app/test/[id]/page.tsx` - Loads assessment for candidate
- `app/test/[id]/info/page.tsx` - Assessment info page
- `app/test/[id]/assessment/page.tsx` - Assessment taking page
- `app/test/[id]/submitted/page.tsx` - Submission confirmation
- `app/recruiter/candidates/[id]/page.tsx` - Candidate detail view
- `lib/submissionService.ts` - Updates job candidate counts

**Data Structure:**
```typescript
{
  id: string
  title: string
  company: string
  description: string
  parsed_skills: ParsedSkills
  experience_level: string
  config: AssessmentConfig
  questions: Question[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  candidatesCount: number
  questionsCount: number
}
```

**Supabase Tables:**
- `jobs` - Job metadata
- `assessments` - Assessment configuration
- `questions` - Individual questions

---

### 2. **Submissions Storage** (`recruiter_submissions`)
**Location:** `lib/submissionService.ts`
**Purpose:** Store candidate submissions with answers and scores

**Files Using:**
- `lib/submissionService.ts` - All submission CRUD operations
- `app/recruiter/candidates/page.tsx` - Lists all submissions
- `app/recruiter/candidates/[id]/page.tsx` - View submission details
- `app/recruiter/analytics/page.tsx` - Analytics based on submissions
- `app/recruiter/dashboard/page.tsx` - Stats from submissions
- `app/test/[id]/assessment/page.tsx` - Saves submission on submit

**Data Structure:**
```typescript
{
  id: string
  assessmentId: string
  jobId: string
  jobTitle: string
  company: string
  candidateInfo: {
    name: string
    email: string
    userId?: string
    startedAt: string
  }
  answers: Record<string, Answer>
  antiCheatData: {...}
  plagiarismData?: {...}
  botDetectionData?: {...}
  submittedAt: string
  status: 'pending' | 'evaluated' | 'shortlisted' | 'rejected'
  scores?: {...}
  resumeData?: any
}
```

**Supabase Tables:**
- `submissions` - Submission metadata
- `answers` - Individual question answers
- `scores` - Evaluation scores and rankings

---

### 3. **Resume Data Storage** (`resume_data_${assessmentId}`)
**Location:** `app/contexts/ResumeContext.tsx`
**Purpose:** Store parsed resume data temporarily

**Files Using:**
- `app/contexts/ResumeContext.tsx` - Resume context provider
- `lib/submissionService.ts` - Retrieves resume data for submissions

**Data Structure:**
```typescript
{
  skills: string[]
  experience: number
  education: string[]
  // ... other resume fields
}
```

**Supabase Tables:**
- `submissions.resume_data` (JSONB column) - Already in schema

---

### 4. **Quota Manager** (API Keys)
**Location:** `lib/quota-manager.ts`
**Purpose:** Cache API key usage and quotas

**Decision:** **KEEP IN localStorage** - This is operational/cache data, not business data. No need to migrate.

---

## Migration Strategy

### Phase 1: Create Supabase Services
1. ✅ Create `lib/jobService.ts` - Supabase job/assessment operations
2. ✅ Create `lib/submissionServiceSupabase.ts` - Supabase submission operations
3. ✅ Create `lib/migrationService.ts` - One-time migration utility

### Phase 2: Dual-Write Period
- Keep localStorage writes for backward compatibility
- Add Supabase writes alongside
- Read from Supabase first, fallback to localStorage

### Phase 3: Full Migration
- Remove localStorage dependencies
- Update all components to use Supabase services
- Remove migration code

## Implementation Priority

### High Priority (Core Functionality)
1. **Jobs/Assessments** - Required for hackathon demo
2. **Submissions** - Required for candidate evaluation

### Medium Priority
3. **Resume Data** - Can be migrated later, already stored in submissions

### Low Priority
4. **Quota Manager** - Keep in localStorage

## Database Schema Mapping

### Jobs → Supabase
```typescript
// localStorage
{
  id: string
  title: string
  company: string
  // ...
}

// Supabase
jobs: {
  id: UUID
  title: VARCHAR
  company: VARCHAR
  recruiter_id: UUID
  // ...
}
assessments: {
  id: UUID
  job_id: UUID
  config: JSONB
  // ...
}
questions: {
  id: UUID
  assessment_id: UUID
  content: JSONB
  // ...
}
```

### Submissions → Supabase
```typescript
// localStorage
{
  id: string
  assessmentId: string
  answers: Record<string, Answer>
  // ...
}

// Supabase
submissions: {
  id: UUID
  assessment_id: UUID
  candidate_id: UUID
  // ...
}
answers: {
  id: UUID
  submission_id: UUID
  question_id: UUID
  response: JSONB
  // ...
}
scores: {
  submission_id: UUID
  total_score: DECIMAL
  // ...
}
```

## Benefits of Migration

✅ **Scalability** - Handle thousands of assessments and submissions
✅ **Security** - Row-level security, encrypted data
✅ **Reliability** - Database backups, ACID transactions
✅ **Multi-user** - Concurrent access support
✅ **Analytics** - Better querying capabilities
✅ **Production Ready** - Required for hackathon deployment

## Migration Checklist

- [ ] Run `database-schema.sql` in Supabase SQL Editor
- [ ] Create `lib/jobService.ts` with Supabase operations
- [ ] Create `lib/submissionServiceSupabase.ts` with Supabase operations
- [ ] Create `lib/migrationService.ts` for one-time migration
- [ ] Update `app/recruiter/jobs/new/page.tsx` to use jobService
- [ ] Update `app/recruiter/dashboard/page.tsx` to use jobService
- [ ] Update `lib/submissionService.ts` to use Supabase
- [ ] Update all pages that read jobs/assessments
- [ ] Test RLS policies
- [ ] Run migration script to move existing data
- [ ] Remove localStorage fallbacks

## Notes

- Keep localStorage as fallback during development
- Test thoroughly before removing localStorage
- Consider gradual migration (dual-write period)
- Backup localStorage data before migration
- Document environment variables needed
