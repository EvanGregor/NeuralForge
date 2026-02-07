-- Create resume_data table to store user resume analysis
-- Run this in your Supabase SQL Editor

CREATE TABLE resume_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ats_score INTEGER NOT NULL DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  analysis JSONB DEFAULT '{}',
  personal_info JSONB DEFAULT '{}',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  summary TEXT DEFAULT '',
  achievements TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  projects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE resume_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own resume data" ON resume_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume data" ON resume_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume data" ON resume_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume data" ON resume_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resume_data_updated_at
  BEFORE UPDATE ON resume_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_resume_data_user_id ON resume_data(user_id);
CREATE INDEX idx_resume_data_created_at ON resume_data(created_at DESC);
