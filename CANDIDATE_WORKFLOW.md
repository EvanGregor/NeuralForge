# Candidate Workflow - Complete Implementation

## Overview
This document describes the new candidate assessment workflow that is hackathon-friendly, requires no signup/login, and provides a seamless experience.

## Flow Architecture

### 1️⃣ Assessment Link Page (`/test/[id]`)
**Route:** `app/test/[id]/page.tsx`

**Features:**
- ✅ Shows job role, company, and assessment details
- ✅ Displays skills being evaluated
- ✅ Shows duration and question breakdown
- ✅ Clear instructions for candidates
- ✅ Builds trust and transparency
- ✅ No authentication required

**What Candidates See:**
- Job title and company
- Skills being evaluated (technical, tools, domain knowledge)
- Duration (e.g., 60 minutes)
- Question breakdown (MCQs, Subjective, Coding)
- Instructions and guidelines
- Anti-cheat notice (transparent)

### 2️⃣ Candidate Info Collection (`/test/[id]/info`)
**Route:** `app/test/[id]/info/page.tsx`

**Features:**
- ✅ Minimal friction - only name and email required
- ✅ Optional resume upload (PDF/DOC/DOCX/TXT)
- ✅ Resume parsing integration
- ✅ No signup required
- ✅ No login required
- ✅ Hackathon-friendly

**Data Collected:**
- Full Name (required)
- Email Address (required)
- Resume File (optional, but recommended)

**Resume Processing:**
- Automatically parsed using `/api/resume-parser-v2`
- Skills extracted
- ATS score calculated
- Stored in sessionStorage for assessment

### 3️⃣ Sequential Assessment (`/test/[id]/assessment`)
**Route:** `app/test/[id]/assessment/page.tsx`

**Features:**
- ✅ Sequential sections (cannot skip ahead)
- ✅ Section A: MCQs (must complete all)
- ✅ Section B: Subjective Questions (must complete all)
- ✅ Section C: Coding Challenges (must complete all)
- ✅ Auto-save answers
- ✅ Timer with countdown
- ✅ Progress tracking per section
- ✅ Question navigation within section

**Section Flow:**
1. **Section A: MCQs**
   - Multiple choice questions
   - Radio button selection
   - Auto-saved on selection
   - Progress: X/Y completed

2. **Section B: Subjective**
   - Scenario-based questions
   - Text area for answers
   - Word limit indicators
   - Auto-saved as typing

3. **Section C: Coding**
   - Problem statements
   - Monaco code editor
   - Input/output format shown
   - Auto-saved code

**Anti-Cheat (Silent):**
- ✅ Tab switch detection (logged, no UI disturbance)
- ✅ Copy-paste detection (logged)
- ✅ Time per question tracking
- ✅ Answer pattern analysis
- ✅ All data collected silently in background
- ✅ No warnings shown to candidate (unless severe)

### 4️⃣ Submission Confirmation (`/test/[id]/submitted`)
**Route:** `app/test/[id]/submitted/page.tsx`

**Features:**
- ✅ Success message
- ✅ Clear next steps
- ✅ Professional thank you
- ✅ No immediate results (if feedback disabled)

## Data Flow

### Session Storage Keys:
- `candidate_info_[assessmentId]` - Candidate name, email, start time
- `resume_data_[assessmentId]` - Parsed resume data
- `assessment_answers_[assessmentId]` - All answers (auto-saved)
- `submission_[assessmentId]` - Final submission with anti-cheat data

### Submission Data Structure:
```typescript
{
  assessmentId: string
  candidateInfo: {
    name: string
    email: string
    startedAt: string
  }
  answers: Record<string, Answer>
  antiCheatData: {
    tab_switches: number
    copy_paste_detected: boolean
    time_anomalies: boolean
    question_times: Record<string, number>
    suspicious_patterns: string[]
  }
  submittedAt: string
  job: Job
}
```

## Anti-Cheat Monitoring

### Silent Tracking (No UI Disturbance):
1. **Tab Switches**
   - Detects when candidate switches tabs/windows
   - Increments counter silently
   - No warning shown

2. **Copy-Paste Detection**
   - Detects paste events
   - Flags in anti-cheat data
   - No warning shown

3. **Time Tracking**
   - Tracks time spent per question
   - Identifies anomalies (too fast/too slow)
   - Pattern analysis

4. **Answer Patterns**
   - Detects random guessing (MCQ)
   - Identifies suspicious patterns
   - All logged for recruiter review

### Why Silent?
- Better candidate experience
- Doesn't interrupt flow
- Recruiter gets full data for review
- Reduces false positives from nervous candidates

## Integration Points

### For Recruiters:
1. **Generate Assessment Link:**
   - After creating assessment, generate shareable link
   - Format: `https://yourdomain.com/test/[assessmentId]`
   - Can be shared via email, job boards, etc.

2. **View Submissions:**
   - All submissions stored with anti-cheat data
   - Can review candidate performance
   - Resume data included for comparison

### For Candidates:
1. **Access Assessment:**
   - Click link → See overview → Enter info → Take test
   - No account creation needed
   - Works on any device

2. **Resume Upload:**
   - Optional but recommended
   - Helps with skill matching
   - Improves evaluation accuracy

## Future Enhancements

### Optional Feedback Page:
- If enabled by recruiter, show:
  - Score summary
  - Skill strengths
  - Improvement areas
  - Makes platform candidate-friendly

### Evaluation Pipeline (Backend):
After submission:
1. MCQs → Auto-scored immediately
2. Coding → Test cases evaluated
3. Subjective → AI rubric evaluation
4. Resume ↔ JD similarity checked
5. Resume ↔ Performance mismatch flagged
6. Final weighted score calculated
7. Ranking updated

## Testing the Flow

1. **Create Assessment:**
   - Go to `/recruiter/jobs/new`
   - Create and publish assessment
   - Get assessment ID

2. **Share Link:**
   - Format: `/test/[assessmentId]`
   - Share with candidate

3. **Candidate Journey:**
   - Opens link → Sees overview
   - Enters name/email/resume
   - Takes assessment sequentially
   - Submits → Sees confirmation

## Key Benefits

✅ **Hackathon-Friendly:** No signup/login friction
✅ **Transparent:** Clear instructions and expectations
✅ **Fair:** Silent anti-cheat monitoring
✅ **Professional:** Clean, modern UI
✅ **Mobile-Friendly:** Works on all devices
✅ **Fast:** Minimal steps to start
✅ **Secure:** Anti-cheat data collected
✅ **Flexible:** Resume optional but recommended

## Files Created

1. `app/test/[id]/page.tsx` - Assessment link/overview page
2. `app/test/[id]/info/page.tsx` - Candidate info collection
3. `app/test/[id]/assessment/page.tsx` - Sequential assessment taking
4. `app/test/[id]/submitted/page.tsx` - Submission confirmation

## Next Steps

1. ✅ Basic flow implemented
2. ⏳ Add evaluation API integration
3. ⏳ Add optional feedback page
4. ⏳ Add recruiter dashboard for viewing submissions
5. ⏳ Add email notifications
