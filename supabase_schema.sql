-- ==============================================================================
-- AUGUST PERSONAL EXAM TRACKER — SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Instructions:
-- 1. Create a free project at https://supabase.com
-- 2. Open your project dashboard -> SQL Editor -> New Query
-- 3. Paste this entire script and click "Run"
-- 4. Copy your Project URL & Anon Public Key from Project Settings > API
-- ==============================================================================

-- 1. Enable pgcrypto extension for cryptographic helpers if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table (Stores Salted Hash of 4-Digit Numeric PIN)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- 3. Domain Entity Tables (15 Stores matching the Tracker Domain Model)
-- Each row is keyed by (user_id, id) with JSONB payload ensuring 100% schema fidelity

-- Table: commitments
CREATE TABLE IF NOT EXISTS public.commitments (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns commitments" ON public.commitments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns subjects" ON public.subjects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: topics
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns topics" ON public.topics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: subtopics
CREATE TABLE IF NOT EXISTS public.subtopics (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns subtopics" ON public.subtopics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: topic_progress
CREATE TABLE IF NOT EXISTS public.topic_progress (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns topic_progress" ON public.topic_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: study_logs
CREATE TABLE IF NOT EXISTS public.study_logs (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns study_logs" ON public.study_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: weekly_plans
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns weekly_plans" ON public.weekly_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: revisions
CREATE TABLE IF NOT EXISTS public.revisions (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns revisions" ON public.revisions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: mock_tests
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns mock_tests" ON public.mock_tests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: mistakes
CREATE TABLE IF NOT EXISTS public.mistakes (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns mistakes" ON public.mistakes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: university_courses
CREATE TABLE IF NOT EXISTS public.university_courses (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.university_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns university_courses" ON public.university_courses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: university_items
CREATE TABLE IF NOT EXISTS public.university_items (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.university_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns university_items" ON public.university_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: daily_reviews
CREATE TABLE IF NOT EXISTS public.daily_reviews (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns daily_reviews" ON public.daily_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: weekly_reviews
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns weekly_reviews" ON public.weekly_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Table: app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns app_settings" ON public.app_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Helpful Indexing for multi-device sync queries
CREATE INDEX IF NOT EXISTS idx_study_logs_user_updated ON public.study_logs (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_user_updated ON public.revisions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_updated ON public.weekly_plans (user_id, updated_at DESC);
