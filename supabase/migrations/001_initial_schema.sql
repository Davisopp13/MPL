-- MPL Initial Schema
-- Creates users, categories, subtasks, and log_entries tables

-- 1. Users table (links to Supabase Auth)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  name text NOT NULL,
  team text NOT NULL CHECK (team IN ('CH', 'MH')),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'supervisor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  icon text NOT NULL,
  team text NOT NULL CHECK (team IN ('CH', 'MH')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Subtasks table
CREATE TABLE subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id),
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Log entries table
CREATE TABLE log_entries (
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

-- Indexes
CREATE INDEX idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX idx_log_entries_category_id ON log_entries(category_id);
CREATE INDEX idx_log_entries_created_at ON log_entries(created_at);
CREATE INDEX idx_subtasks_category_id ON subtasks(category_id);
CREATE INDEX idx_categories_team ON categories(team);
