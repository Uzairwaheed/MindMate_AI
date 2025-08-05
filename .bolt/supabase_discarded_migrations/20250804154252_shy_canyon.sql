/*
  # Create sleep entries table

  1. New Tables
    - `sleep_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `bedtime` (time without time zone)
      - `wake_time` (time without time zone)
      - `sleep_duration` (numeric, in hours)
      - `sleep_quality` (integer, 1-10 scale)
      - `mood_after_sleep` (text)
      - `notes` (text, optional)
      - `entry_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sleep_entries` table
    - Add policies for authenticated users to manage their own sleep data

  3. Indexes
    - Index on user_id and entry_date for efficient queries
*/

CREATE TABLE IF NOT EXISTS sleep_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bedtime time NOT NULL,
  wake_time time NOT NULL,
  sleep_duration numeric(4,2) NOT NULL,
  sleep_quality integer NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  mood_after_sleep text NOT NULL,
  notes text DEFAULT '',
  entry_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own sleep entries"
  ON sleep_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own sleep entries"
  ON sleep_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep entries"
  ON sleep_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep entries"
  ON sleep_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_date 
  ON sleep_entries (user_id, entry_date DESC);

CREATE TRIGGER IF NOT EXISTS handle_sleep_entries_updated_at
  BEFORE UPDATE ON sleep_entries
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();