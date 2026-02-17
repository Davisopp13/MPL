-- MPL Initial Schema
-- Safe to run against existing Case Tracker database
-- Uses IF NOT EXISTS and DO blocks to avoid conflicts

-- 1. Users table (links to Supabase Auth)
-- The Case Tracker DB already has a "users" table, so we add missing columns
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  name text NOT NULL,
  team text NOT NULL CHECK (team IN ('CH', 'MH')),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'supervisor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns that MPL needs if they don't already exist on the users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'team') THEN
    ALTER TABLE users ADD COLUMN team text NOT NULL DEFAULT 'CH' CHECK (team IN ('CH', 'MH'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'supervisor'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    ALTER TABLE users ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
    ALTER TABLE users ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
    ALTER TABLE users ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  icon text NOT NULL,
  team text NOT NULL CHECK (team IN ('CH', 'MH')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id),
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Log entries table
CREATE TABLE IF NOT EXISTS log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  category_id uuid NOT NULL REFERENCES categories(id),
  subtask_id uuid NOT NULL REFERENCES subtasks(id),
  minutes int NOT NULL CHECK (minutes > 0),
  occurrences int NOT NULL DEFAULT 1 CHECK (occurrences > 0),
  note text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_category_id ON log_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_log_entries_created_at ON log_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_subtasks_category_id ON subtasks(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_team ON categories(team);
