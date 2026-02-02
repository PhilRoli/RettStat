-- RettStat Database Schema v2 - Row Level Security Policies
-- Created: 2026-02-02

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shiftplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_statistics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Everyone can view all profiles
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- Admins can insert profiles
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================================
-- CATEGORY TABLES POLICIES (Read: All, Write: Admin)
-- ============================================================================

-- Units
CREATE POLICY "units_select_all" ON units FOR SELECT USING (true);
CREATE POLICY "units_insert_admin" ON units FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "units_update_admin" ON units FOR UPDATE USING (is_admin());
CREATE POLICY "units_delete_admin" ON units FOR DELETE USING (is_admin());

-- Assignment Categories
CREATE POLICY "assignment_categories_select_all" ON assignment_categories FOR SELECT USING (true);
CREATE POLICY "assignment_categories_insert_admin" ON assignment_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "assignment_categories_update_admin" ON assignment_categories FOR UPDATE USING (is_admin());
CREATE POLICY "assignment_categories_delete_admin" ON assignment_categories FOR DELETE USING (is_admin());

-- Qualification Categories
CREATE POLICY "qualification_categories_select_all" ON qualification_categories FOR SELECT USING (true);
CREATE POLICY "qualification_categories_insert_admin" ON qualification_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "qualification_categories_update_admin" ON qualification_categories FOR UPDATE USING (is_admin());
CREATE POLICY "qualification_categories_delete_admin" ON qualification_categories FOR DELETE USING (is_admin());

-- Vehicle Types
CREATE POLICY "vehicle_types_select_all" ON vehicle_types FOR SELECT USING (true);
CREATE POLICY "vehicle_types_insert_admin" ON vehicle_types FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "vehicle_types_update_admin" ON vehicle_types FOR UPDATE USING (is_admin());
CREATE POLICY "vehicle_types_delete_admin" ON vehicle_types FOR DELETE USING (is_admin());

-- Absence Categories
CREATE POLICY "absence_categories_select_all" ON absence_categories FOR SELECT USING (true);
CREATE POLICY "absence_categories_insert_admin" ON absence_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "absence_categories_update_admin" ON absence_categories FOR UPDATE USING (is_admin());
CREATE POLICY "absence_categories_delete_admin" ON absence_categories FOR DELETE USING (is_admin());

-- Tour Types
CREATE POLICY "tour_types_select_all" ON tour_types FOR SELECT USING (true);
CREATE POLICY "tour_types_insert_admin" ON tour_types FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tour_types_update_admin" ON tour_types FOR UPDATE USING (is_admin());
CREATE POLICY "tour_types_delete_admin" ON tour_types FOR DELETE USING (is_admin());

-- Event Categories
CREATE POLICY "event_categories_select_all" ON event_categories FOR SELECT USING (true);
CREATE POLICY "event_categories_insert_admin" ON event_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "event_categories_update_admin" ON event_categories FOR UPDATE USING (is_admin());
CREATE POLICY "event_categories_delete_admin" ON event_categories FOR DELETE USING (is_admin());

-- ============================================================================
-- ENTITY TABLES POLICIES
-- ============================================================================

-- Assignments (Read: All, Write: Admin)
CREATE POLICY "assignments_select_all" ON assignments FOR SELECT USING (true);
CREATE POLICY "assignments_insert_admin" ON assignments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "assignments_update_admin" ON assignments FOR UPDATE USING (is_admin());
CREATE POLICY "assignments_delete_admin" ON assignments FOR DELETE USING (is_admin());

-- Qualifications (Read: All, Write: Admin)
CREATE POLICY "qualifications_select_all" ON qualifications FOR SELECT USING (true);
CREATE POLICY "qualifications_insert_admin" ON qualifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "qualifications_update_admin" ON qualifications FOR UPDATE USING (is_admin());
CREATE POLICY "qualifications_delete_admin" ON qualifications FOR DELETE USING (is_admin());

-- Vehicles (Read: All, Write: Admin)
CREATE POLICY "vehicles_select_all" ON vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_insert_admin" ON vehicles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "vehicles_update_admin" ON vehicles FOR UPDATE USING (is_admin());
CREATE POLICY "vehicles_delete_admin" ON vehicles FOR DELETE USING (is_admin());

-- Absences (Read: All, Write: Admin)
CREATE POLICY "absences_select_all" ON absences FOR SELECT USING (true);
CREATE POLICY "absences_insert_admin" ON absences FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "absences_update_admin" ON absences FOR UPDATE USING (is_admin());
CREATE POLICY "absences_delete_admin" ON absences FOR DELETE USING (is_admin());

-- Event Groups (Read: All, Write: Admin)
CREATE POLICY "event_groups_select_all" ON event_groups FOR SELECT USING (true);
CREATE POLICY "event_groups_insert_admin" ON event_groups FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "event_groups_update_admin" ON event_groups FOR UPDATE USING (is_admin());
CREATE POLICY "event_groups_delete_admin" ON event_groups FOR DELETE USING (is_admin());

-- ============================================================================
-- USER RELATIONSHIP POLICIES
-- ============================================================================

-- User Qualifications (Read: All, Write: Admin or own)
CREATE POLICY "user_qualifications_select_all" ON user_qualifications FOR SELECT USING (true);
CREATE POLICY "user_qualifications_insert_admin" ON user_qualifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "user_qualifications_update_admin" ON user_qualifications FOR UPDATE USING (is_admin());
CREATE POLICY "user_qualifications_update_own" ON user_qualifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_qualifications_delete_admin" ON user_qualifications FOR DELETE USING (is_admin());

-- User Assignments (Read: All, Write: Admin)
CREATE POLICY "user_assignments_select_all" ON user_assignments FOR SELECT USING (true);
CREATE POLICY "user_assignments_insert_admin" ON user_assignments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "user_assignments_update_admin" ON user_assignments FOR UPDATE USING (is_admin());
CREATE POLICY "user_assignments_delete_admin" ON user_assignments FOR DELETE USING (is_admin());

-- User Absences (Read: All, Write: Own or Admin)
CREATE POLICY "user_absences_select_all" ON user_absences FOR SELECT USING (true);
CREATE POLICY "user_absences_insert_own" ON user_absences 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_assignments WHERE id = user_assignment_id AND user_id = auth.uid())
  );
CREATE POLICY "user_absences_insert_admin" ON user_absences FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "user_absences_update_own" ON user_absences 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_assignments WHERE id = user_assignment_id AND user_id = auth.uid())
  );
CREATE POLICY "user_absences_update_admin" ON user_absences FOR UPDATE USING (is_admin());
CREATE POLICY "user_absences_delete_own" ON user_absences 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_assignments WHERE id = user_assignment_id AND user_id = auth.uid())
  );
CREATE POLICY "user_absences_delete_admin" ON user_absences FOR DELETE USING (is_admin());

-- ============================================================================
-- SHIFTPLAN POLICIES
-- ============================================================================

-- Shiftplans (Read: All, Write: Admin/Manager)
CREATE POLICY "shiftplans_select_all" ON shiftplans FOR SELECT USING (true);
CREATE POLICY "shiftplans_insert_admin_manager" ON shiftplans FOR INSERT WITH CHECK (is_admin_or_manager());
CREATE POLICY "shiftplans_update_admin_manager" ON shiftplans FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "shiftplans_delete_admin" ON shiftplans FOR DELETE USING (is_admin());

-- Tours (Read: All, Write: Admin/Manager)
CREATE POLICY "tours_select_all" ON tours FOR SELECT USING (true);
CREATE POLICY "tours_insert_admin_manager" ON tours FOR INSERT WITH CHECK (is_admin_or_manager());
CREATE POLICY "tours_update_admin_manager" ON tours FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "tours_delete_admin" ON tours FOR DELETE USING (is_admin());

-- ============================================================================
-- EVENT POLICIES
-- ============================================================================

-- Events (Read: All, Write: Admin/Manager)
CREATE POLICY "events_select_all" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert_admin_manager" ON events FOR INSERT WITH CHECK (is_admin_or_manager());
CREATE POLICY "events_update_admin_manager" ON events FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "events_delete_admin" ON events FOR DELETE USING (is_admin());

-- Event Positions (Read: All, Write: Admin/Manager)
CREATE POLICY "event_positions_select_all" ON event_positions FOR SELECT USING (true);
CREATE POLICY "event_positions_insert_admin_manager" ON event_positions FOR INSERT WITH CHECK (is_admin_or_manager());
CREATE POLICY "event_positions_update_admin_manager" ON event_positions FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "event_positions_delete_admin" ON event_positions FOR DELETE USING (is_admin());

-- Event Registrations (Read: All, Write: Own or Admin/Manager)
CREATE POLICY "event_registrations_select_all" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "event_registrations_insert_own" ON event_registrations 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "event_registrations_insert_admin_manager" ON event_registrations 
  FOR INSERT WITH CHECK (is_admin_or_manager());
CREATE POLICY "event_registrations_update_own" ON event_registrations 
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "event_registrations_update_admin_manager" ON event_registrations 
  FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "event_registrations_delete_own" ON event_registrations 
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "event_registrations_delete_admin" ON event_registrations 
  FOR DELETE USING (is_admin());

-- Admin Events (Read: All, Write: Admin)
CREATE POLICY "admin_events_select_all" ON admin_events FOR SELECT USING (true);
CREATE POLICY "admin_events_insert_admin" ON admin_events FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_events_update_admin" ON admin_events FOR UPDATE USING (is_admin());
CREATE POLICY "admin_events_delete_admin" ON admin_events FOR DELETE USING (is_admin());

-- ============================================================================
-- NEWS & STATISTICS POLICIES
-- ============================================================================

-- News (Read: All, Write: Admin/Manager)
CREATE POLICY "news_select_all" ON news FOR SELECT USING (true);
CREATE POLICY "news_insert_admin_manager" ON news FOR INSERT WITH CHECK (is_admin_or_manager());
CREATE POLICY "news_update_admin_manager" ON news FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "news_delete_admin" ON news FOR DELETE USING (is_admin());

-- Monthly Statistics (Read: All, Write: System only via triggers)
CREATE POLICY "monthly_statistics_select_all" ON monthly_statistics FOR SELECT USING (true);
-- No insert/update/delete policies - statistics are managed by triggers

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Enable realtime for key tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE shiftplans;
ALTER PUBLICATION supabase_realtime ADD TABLE tours;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE news;
ALTER PUBLICATION supabase_realtime ADD TABLE user_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_absences;
