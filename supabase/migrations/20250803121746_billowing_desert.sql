/*
  # Create wellness and goals tracking schema

  1. New Tables
    - `wellness_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `description` (text)
      - `target_frequency` (text) - daily, weekly, monthly
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `goal_completions`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, foreign key to wellness_goals)
      - `user_id` (uuid, foreign key to auth.users)
      - `completed_date` (date)
      - `notes` (text)
      - `created_at` (timestamp)

    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `quiz_type` (text) - GAD-7, PHQ-9, etc.
      - `total_score` (integer)
      - `severity_level` (text)
      - `answers` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
*/

-- Create wellness goals table
CREATE TABLE IF NOT EXISTS wellness_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  target_frequency text DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekly', 'monthly')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create goal completions table
CREATE TABLE IF NOT EXISTS goal_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES wellness_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create quiz results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type text NOT NULL,
  total_score integer NOT NULL,
  severity_level text NOT NULL,
  answers jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Wellness goals policies
CREATE POLICY "Users can read own wellness goals"
  ON wellness_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness goals"
  ON wellness_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness goals"
  ON wellness_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness goals"
  ON wellness_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Goal completions policies
CREATE POLICY "Users can read own goal completions"
  ON goal_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal completions"
  ON goal_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal completions"
  ON goal_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal completions"
  ON goal_completions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Quiz results policies
CREATE POLICY "Users can read own quiz results"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wellness_goals_user_active 
  ON wellness_goals(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_goal_completions_user_date 
  ON goal_completions(user_id, completed_date DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_created 
  ON quiz_results(user_id, created_at DESC);