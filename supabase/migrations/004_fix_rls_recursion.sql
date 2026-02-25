-- Fix infinite recursion in RLS policies
-- The supervisor policies queried the users table from within users policies,
-- causing infinite recursion. SECURITY DEFINER functions bypass RLS.

-- ============================================================
-- Helper functions (bypass RLS via SECURITY DEFINER)
-- ============================================================

CREATE OR REPLACE FUNCTION get_auth_user_role()
  RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_auth_user_team()
  RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT team FROM users WHERE id = auth.uid()
$$;

-- ============================================================
-- Fix USERS supervisor policy
-- ============================================================

DROP POLICY IF EXISTS "Supervisors can read team members" ON users;

CREATE POLICY "Supervisors can read team members"
  ON users FOR SELECT
  USING (
    get_auth_user_role() = 'supervisor'
    AND get_auth_user_team() = users.team
  );

-- ============================================================
-- Fix LOG_ENTRIES supervisor policy
-- ============================================================

DROP POLICY IF EXISTS "Supervisors can read team log entries" ON log_entries;

CREATE POLICY "Supervisors can read team log entries"
  ON log_entries FOR SELECT
  USING (
    get_auth_user_role() = 'supervisor'
    AND get_auth_user_team() = (
      SELECT team FROM users WHERE id = log_entries.user_id
    )
  );
