-- RettStat Row Level Security Policies
-- Phase 4: Secure data access based on user roles

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_statistics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view all active profiles
CREATE POLICY "Users can view active profiles"
  ON profiles FOR SELECT
  USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can do everything with profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- QUALIFICATIONS POLICIES
-- ============================================================================

-- Everyone can view active qualifications
CREATE POLICY "View active qualifications"
  ON qualifications FOR SELECT
  USING (is_active = true);

-- Admins can manage qualifications
CREATE POLICY "Admins can manage qualifications"
  ON qualifications FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- USER QUALIFICATIONS POLICIES
-- ============================================================================

-- Users can view all user qualifications
CREATE POLICY "View all user qualifications"
  ON user_qualifications FOR SELECT
  USING (true);

-- Users can update their own qualifications (with manager/admin approval workflow elsewhere)
CREATE POLICY "Users can view own qualifications"
  ON user_qualifications FOR SELECT
  USING (user_id = auth.uid());

-- Admins and managers can manage user qualifications
CREATE POLICY "Admins/managers can manage user qualifications"
  ON user_qualifications FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- ASSIGNMENTS POLICIES
-- ============================================================================

-- Everyone can view active assignments
CREATE POLICY "View active assignments"
  ON assignments FOR SELECT
  USING (is_active = true);

-- Admins can manage assignments
CREATE POLICY "Admins can manage assignments"
  ON assignments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- USER ASSIGNMENTS POLICIES
-- ============================================================================

-- Users can view all user assignments
CREATE POLICY "View all user assignments"
  ON user_assignments FOR SELECT
  USING (true);

-- Admins and managers can manage user assignments
CREATE POLICY "Admins/managers can manage user assignments"
  ON user_assignments FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- SHIFT TYPES POLICIES
-- ============================================================================

-- Everyone can view active shift types
CREATE POLICY "View active shift types"
  ON shift_types FOR SELECT
  USING (is_active = true);

-- Admins can manage shift types
CREATE POLICY "Admins can manage shift types"
  ON shift_types FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- SHIFTS POLICIES
-- ============================================================================

-- Users can view all shifts (for planning purposes)
CREATE POLICY "View all shifts"
  ON shifts FOR SELECT
  USING (true);

-- Users can update their own shifts (status changes, notes)
CREATE POLICY "Users can update own shifts"
  ON shifts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and managers can create, update, and delete any shift
CREATE POLICY "Admins/managers can manage all shifts"
  ON shifts FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Users can view all events
CREATE POLICY "View all events"
  ON events FOR SELECT
  USING (true);

-- Admins and managers can manage events
CREATE POLICY "Admins/managers can manage events"
  ON events FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- EVENT POSITIONS POLICIES
-- ============================================================================

-- Users can view all event positions
CREATE POLICY "View all event positions"
  ON event_positions FOR SELECT
  USING (true);

-- Admins and managers can manage event positions
CREATE POLICY "Admins/managers can manage event positions"
  ON event_positions FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- EVENT REGISTRATIONS POLICIES
-- ============================================================================

-- Users can view all event registrations
CREATE POLICY "View all event registrations"
  ON event_registrations FOR SELECT
  USING (true);

-- Users can create their own registrations
CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update/delete their own registrations
CREATE POLICY "Users can manage own registrations"
  ON event_registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own registrations"
  ON event_registrations FOR DELETE
  USING (user_id = auth.uid());

-- Admins and managers can manage all registrations
CREATE POLICY "Admins/managers can manage all registrations"
  ON event_registrations FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- NEWS POLICIES
-- ============================================================================

-- Users can view published news
CREATE POLICY "View published news"
  ON news FOR SELECT
  USING (
    published_at IS NOT NULL 
    AND published_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Admins and managers can manage news
CREATE POLICY "Admins/managers can manage news"
  ON news FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- STATISTICS POLICIES
-- ============================================================================

-- Users can view their own statistics
CREATE POLICY "Users can view own statistics"
  ON monthly_statistics FOR SELECT
  USING (user_id = auth.uid());

-- Admins and managers can view all statistics
CREATE POLICY "Admins/managers can view all statistics"
  ON monthly_statistics FOR SELECT
  USING (is_admin_or_manager());

-- System can update statistics (for background jobs)
CREATE POLICY "System can manage statistics"
  ON monthly_statistics FOR ALL
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to all tables
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON qualifications TO authenticated;
GRANT ALL ON user_qualifications TO authenticated;
GRANT ALL ON assignments TO authenticated;
GRANT ALL ON user_assignments TO authenticated;
GRANT ALL ON shift_types TO authenticated;
GRANT ALL ON shifts TO authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_positions TO authenticated;
GRANT ALL ON event_registrations TO authenticated;
GRANT ALL ON news TO authenticated;
GRANT ALL ON monthly_statistics TO authenticated;

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE news;
