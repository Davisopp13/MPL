-- MPL Row Level Security Policies
-- Enables RLS on all tables and creates access policies

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS policies
-- Members can read their own row.
-- Supervisors can read all users on their team.
-- Users can insert their own row (onboarding).
-- Users can update their own row.
-- ============================================================

CREATE POLICY "Users can read own row"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Supervisors can read team members"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS me
      WHERE me.id = auth.uid()
        AND me.role = 'supervisor'
        AND me.team = users.team
    )
  );

CREATE POLICY "Users can insert own row"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own row"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- CATEGORIES policies
-- All authenticated users can read categories.
-- ============================================================

CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- SUBTASKS policies
-- All authenticated users can read subtasks.
-- ============================================================

CREATE POLICY "Authenticated users can read subtasks"
  ON subtasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- LOG_ENTRIES policies
-- Users can insert their own entries.
-- Users can select their own entries.
-- Supervisors can select entries for users on their team.
-- ============================================================

CREATE POLICY "Users can insert own log entries"
  ON log_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own log entries"
  ON log_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Supervisors can read team log entries"
  ON log_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS me
      JOIN users AS entry_owner ON entry_owner.id = log_entries.user_id
      WHERE me.id = auth.uid()
        AND me.role = 'supervisor'
        AND me.team = entry_owner.team
    )
  );
