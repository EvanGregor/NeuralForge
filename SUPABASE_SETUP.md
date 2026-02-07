# Supabase Setup for Resume Data

## Issue
The resume parser is working perfectly, but Supabase is returning a 400 error because the `resume_data` table doesn't exist in your database.

## Solution
You need to create the `resume_data` table in your Supabase database.

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the SQL Script**
   - Copy and paste the contents of `create-resume-data-table.sql`
   - Click "Run" to execute the script

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called `resume_data`

## Alternative: Skip Supabase
If you don't want to set up Supabase right now, the app will work perfectly without it. All resume data is saved locally in your browser and will persist across sessions.

## What This Fixes
- ✅ Stops the 400 error from Supabase
- ✅ Enables resume data to be saved to the database
- ✅ Allows dashboard to show skills and scores from database
- ✅ Enables data persistence across devices

## Current Status
- ✅ Resume parsing works perfectly
- ✅ Data is saved locally (context + localStorage)
- ✅ Dashboard shows skills and scores
- ⚠️ Supabase integration needs table setup (optional)