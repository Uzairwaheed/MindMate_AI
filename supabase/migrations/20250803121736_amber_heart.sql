/*
  # Create mood tracking schema

  1. New Tables
    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `mood_score` (integer, 1-5 scale)
      - `emotions` (text array)
      - `notes` (text)
      - `entry_date` (date)
      - `entry_time` (time)
      - `created_at` (timestamp)

    - `sentiment_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `image_url` (text)
      - `detected_emotion` (text)
      - `confidence_score` (decimal)
      - `analysis_result` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

-- Create mood entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score integer NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  emotions text[] DEFAULT '{}',
  notes text DEFAULT '',
  entry_date date DEFAULT CURRENT_DATE,
  entry_time time DEFAULT CURRENT_TIME,
  created_at timestamptz DEFAULT now()
);

-- Create sentiment analyses table
CREATE TABLE IF NOT EXISTS sentiment_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text,
  detected_emotion text NOT NULL,
  confidence_score decimal(3,2) DEFAULT 0,
  analysis_result jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analyses ENABLE ROW LEVEL SECURITY;

-- Mood entries policies
CREATE POLICY "Users can read own mood entries"
  ON mood_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sentiment analyses policies
CREATE POLICY "Users can read own sentiment analyses"
  ON sentiment_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sentiment analyses"
  ON sentiment_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date 
  ON mood_entries(user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_user_created 
  ON sentiment_analyses(user_id, created_at DESC);