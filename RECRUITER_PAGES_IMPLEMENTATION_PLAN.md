# Recruiter Pages Implementation Plan
## Candidates & Analytics Pages - Phased Approach

## Current State Analysis

### ✅ What Exists:
- Recruiter dashboard with assessments list
- Assessment creation flow
- Candidate detail page (`/recruiter/candidates/[id]`) - has UI but uses mock data
- Leaderboard page for specific jobs (`/recruiter/jobs/[id]/leaderboard`)
- Database schema defined (not yet used)
- Submissions stored in sessionStorage (from candidate flow)

### ❌ What's Missing:
- **Candidates page** (`/recruiter/candidates`) - Main list view
- **Analytics page** (`/recruiter/analytics`) - Charts and metrics
- Submission collection service (from sessionStorage to recruiter view)
- Evaluation/scoring service
- Data persistence layer

---

## 📋 PHASE 1: Data Foundation & Submission Service
**Goal:** Create infrastructure to collect and manage submissions

### Tasks:
1. **Create Submission Service** (`lib/submissionService.ts`)
   - Collect submissions from sessionStorage
   - Store in localStorage for recruiter access
   - Calculate scores (MCQ auto-score, coding test cases, subjective placeholder)
   - Format data for recruiter views

2. **Update Assessment Submission** (`app/test/[id]/assessment/page.tsx`)
   - Call submission service on submit
   - Store in recruiter-accessible location
   - Trigger evaluation

3. **Create Evaluation Helper** (`lib/evaluationService.ts`)
   - Score MCQs automatically
   - Evaluate coding solutions (use existing compile API)
   - Placeholder for subjective evaluation (AI later)
   - Calculate section scores, skill scores, rankings

**Deliverables:**
- ✅ `lib/submissionService.ts` - Submission management
- ✅ `lib/evaluationService.ts` - Scoring logic
- ✅ Updated assessment submission flow

**Estimated Time:** 2-3 hours

---

## 📋 PHASE 2: Candidates Page (Main List View)
**Goal:** Create comprehensive candidates listing page

### Tasks:
1. **Create Candidates Page** (`app/recruiter/candidates/page.tsx`)
   - List all candidates across all assessments
   - Show: Name, Email, Assessment, Score, Status, Submitted Date
   - Filter by: Assessment, Status, Score Range
   - Search by: Name, Email
   - Sort by: Score, Date, Name

2. **Features:**
   - Quick actions: View, Shortlist, Reject
   - Bulk actions (select multiple)
   - Export to CSV
   - Status badges (Pending, Shortlisted, Rejected)
   - Anti-cheat flags visible
   - Link to candidate detail page

3. **Stats Cards:**
   - Total Candidates
   - Shortlisted Count
   - Average Score
   - Pending Reviews

**Deliverables:**
- ✅ `app/recruiter/candidates/page.tsx` - Main candidates list
- ✅ Filtering and search functionality
- ✅ Status management
- ✅ Stats overview

**Estimated Time:** 3-4 hours

---

## 📋 PHASE 3: Candidate Detail Page Enhancement
**Goal:** Connect existing detail page to real data

### Tasks:
1. **Update Candidate Detail Page** (`app/recruiter/candidates/[id]/page.tsx`)
   - Load real submission data (not mock)
   - Show actual answers
   - Display calculated scores
   - Show resume data if available
   - Anti-cheat flags display
   - Skill mismatch analysis

2. **Add Actions:**
   - Shortlist/Reject buttons
   - Download resume
   - View full answers
   - Add notes/comments

**Deliverables:**
- ✅ Updated candidate detail page with real data
- ✅ Action buttons functional
- ✅ Resume display

**Estimated Time:** 2-3 hours

---

## 📋 PHASE 4: Analytics Page
**Goal:** Create comprehensive analytics dashboard

### Tasks:
1. **Create Analytics Page** (`app/recruiter/analytics/page.tsx`)
   - Overview stats (total assessments, candidates, avg scores)
   - Charts using Recharts:
     - Score distribution (histogram)
     - Assessment completion rates
     - Skill performance heatmap
     - Time trends (submissions over time)
     - Top performing skills
     - Anti-cheat statistics

2. **Filters:**
   - Date range
   - Assessment filter
   - Skill filter

3. **Insights:**
   - AI-generated insights
   - Recommendations
   - Anomaly detection

**Deliverables:**
- ✅ `app/recruiter/analytics/page.tsx` - Analytics dashboard
- ✅ Multiple chart types
- ✅ Filtering capabilities
- ✅ Insights section

**Estimated Time:** 4-5 hours

---

## 📋 PHASE 5: Integration & Polish
**Goal:** Connect everything and add polish

### Tasks:
1. **Update Dashboard:**
   - Link to candidates page
   - Link to analytics
   - Real-time stats from submissions

2. **Update Job Cards:**
   - Show actual candidate count
   - Link to leaderboard with real data

3. **Add Notifications:**
   - New submission alerts
   - Score threshold alerts

4. **Export Features:**
   - Export candidates to CSV
   - Export analytics reports

**Deliverables:**
- ✅ All pages connected
- ✅ Real-time data flow
- ✅ Export functionality
- ✅ Polish and UX improvements

**Estimated Time:** 2-3 hours

---

## 📊 Data Flow Architecture

```
Candidate Submits Assessment
    ↓
sessionStorage: submission_[assessmentId]
    ↓
Submission Service Collects
    ↓
localStorage: recruiter_submissions (all submissions)
    ↓
Evaluation Service Scores
    ↓
Candidates Page Displays
Analytics Page Analyzes
Detail Page Shows Full Report
```

---

## 🗂️ File Structure

```
lib/
├── submissionService.ts      (NEW - Phase 1)
├── evaluationService.ts       (NEW - Phase 1)
└── analyticsService.ts        (NEW - Phase 4)

app/recruiter/
├── candidates/
│   ├── page.tsx              (NEW - Phase 2)
│   └── [id]/
│       └── page.tsx           (UPDATE - Phase 3)
└── analytics/
    └── page.tsx               (NEW - Phase 4)
```

---

## 🎯 Success Criteria

### Phase 1:
- ✅ Submissions collected from candidate flow
- ✅ Scores calculated automatically
- ✅ Data accessible to recruiter

### Phase 2:
- ✅ Candidates page shows all submissions
- ✅ Filtering and search works
- ✅ Status management functional

### Phase 3:
- ✅ Detail page shows real data
- ✅ All candidate info visible
- ✅ Actions work (shortlist/reject)

### Phase 4:
- ✅ Analytics page with charts
- ✅ Multiple metrics displayed
- ✅ Filters functional

### Phase 5:
- ✅ Everything connected
- ✅ Real-time updates
- ✅ Export works

---

## 🚀 Recommended Order

**Start with Phase 1** - Without data foundation, nothing else works
**Then Phase 2** - Most important for recruiters (view candidates)
**Then Phase 3** - Enhance detail view
**Then Phase 4** - Add analytics insights
**Finally Phase 5** - Polish and integration

---

## 📝 Notes

- Using localStorage for now (can migrate to Supabase later)
- Evaluation can be enhanced with AI later
- Analytics can be expanded with more charts
- Export can be extended to PDF later
