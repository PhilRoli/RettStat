-- RettStat Database Schema v3 - RLS Policies for Permission System
-- Created: 2026-02-02

-- ============================================================================
-- DROP OLD ROLE-BASED HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_admin_or_manager();

-- ============================================================================
-- PERMISSION SYSTEM HELPER FUNCTIONS
-- ============================================================================

-- Get all parent units in hierarchy (for permission inheritance)
CREATE OR REPLACE FUNCTION get_unit_hierarchy(p_unit_id UUID)
RETURNS TABLE (unit_id UUID) AS $$
  WITH RECURSIVE unit_tree AS (
    -- Start with the given unit
    SELECT id, parent_unit_id
    FROM units
    WHERE id = p_unit_id
    
    UNION ALL
    
    -- Recursively get parent units
    SELECT u.id, u.parent_unit_id
    FROM units u
    INNER JOIN unit_tree ut ON u.id = ut.parent_unit_id
  )
  SELECT id FROM unit_tree;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_unit_hierarchy IS 'Get all parent units for permission inheritance';

-- Check if user has a specific permission in a unit (with inheritance)
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_name TEXT,
  p_unit_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permission_id UUID;
  v_has_global BOOLEAN;
  v_has_in_hierarchy BOOLEAN;
BEGIN
  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = p_permission_name;
  
  IF v_permission_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check for system_admin permission (global superuser)
  SELECT EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = p_user_id
      AND permission_id = (SELECT id FROM permissions WHERE name = 'system_admin')
  ) INTO v_has_global;
  
  IF v_has_global THEN
    RETURN TRUE;
  END IF;
  
  -- Check for global permission (unit_id IS NULL)
  SELECT EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = p_user_id
      AND permission_id = v_permission_id
      AND unit_id IS NULL
  ) INTO v_has_global;
  
  IF v_has_global THEN
    RETURN TRUE;
  END IF;
  
  -- If no unit specified, only check global
  IF p_unit_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check for permission in unit or any parent unit (inheritance)
  SELECT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = p_user_id
      AND up.permission_id = v_permission_id
      AND up.unit_id IN (SELECT unit_id FROM get_unit_hierarchy(p_unit_id))
  ) INTO v_has_in_hierarchy;
  
  -- Also check assignment-based permissions
  IF NOT v_has_in_hierarchy THEN
    SELECT EXISTS (
      SELECT 1
      FROM user_assignments ua
      JOIN assignment_default_permissions adp ON adp.assignment_id = ua.assignment_id
      WHERE ua.user_id = p_user_id
        AND adp.permission_id = v_permission_id
        AND ua.unit_id IN (SELECT unit_id FROM get_unit_hierarchy(p_unit_id))
    ) INTO v_has_in_hierarchy;
  END IF;
  
  RETURN v_has_in_hierarchy;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION has_permission IS 'Check if user has permission in unit (with inheritance and assignment defaults)';

-- Get all permissions for a user (optionally in a specific unit)
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_unit_id UUID DEFAULT NULL
)
RETURNS TABLE (permission_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name
  FROM permissions p
  WHERE 
    -- System admin has all permissions
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = p_user_id
        AND up.permission_id = (SELECT id FROM permissions WHERE name = 'system_admin')
    )
    OR
    -- Global permission (unit_id IS NULL)
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = p_user_id
        AND up.permission_id = p.id
        AND up.unit_id IS NULL
    )
    OR
    -- Permission in unit hierarchy
    (p_unit_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = p_user_id
        AND up.permission_id = p.id
        AND up.unit_id IN (SELECT unit_id FROM get_unit_hierarchy(p_unit_id))
    ))
    OR
    -- Assignment-based permission
    (p_unit_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM user_assignments ua
      JOIN assignment_default_permissions adp ON adp.assignment_id = ua.assignment_id
      WHERE ua.user_id = p_user_id
        AND adp.permission_id = p.id
        AND ua.unit_id IN (SELECT unit_id FROM get_unit_hierarchy(p_unit_id))
    ));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for user (optionally filtered by unit)';

-- ============================================================================
-- UPDATE EXISTING RLS POLICIES TO USE PERMISSION SYSTEM
-- ============================================================================

-- Drop all old role-based policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_system_admin" ON profiles
  FOR UPDATE USING (has_permission(auth.uid(), 'system_admin'));

CREATE POLICY "profiles_insert_system_admin" ON profiles
  FOR INSERT WITH CHECK (has_permission(auth.uid(), 'system_admin'));

-- ============================================================================
-- PERMISSION SYSTEM POLICIES
-- ============================================================================

-- Permissions (read-only for all)
CREATE POLICY "permissions_select_all" ON permissions
  FOR SELECT USING (true);

-- User Permissions
CREATE POLICY "user_permissions_select_all" ON user_permissions
  FOR SELECT USING (true);

CREATE POLICY "user_permissions_manage_system_admin" ON user_permissions
  FOR ALL USING (has_permission(auth.uid(), 'system_admin'));

-- Assignment Default Permissions
CREATE POLICY "assignment_default_permissions_select_all" ON assignment_default_permissions
  FOR SELECT USING (true);

CREATE POLICY "assignment_default_permissions_manage" ON assignment_default_permissions
  FOR ALL USING (has_permission(auth.uid(), 'manage_assignments'));

-- ============================================================================
-- CATEGORY & ENTITY TABLES POLICIES
-- ============================================================================

-- Units
CREATE POLICY "units_select_all" ON units FOR SELECT USING (true);
CREATE POLICY "units_manage" ON units FOR ALL USING (has_permission(auth.uid(), 'manage_units'));

-- Assignment Categories
CREATE POLICY "assignment_categories_select_all" ON assignment_categories FOR SELECT USING (true);
CREATE POLICY "assignment_categories_manage" ON assignment_categories FOR ALL USING (has_permission(auth.uid(), 'manage_assignments'));

-- Qualification Categories
CREATE POLICY "qualification_categories_select_all" ON qualification_categories FOR SELECT USING (true);
CREATE POLICY "qualification_categories_manage" ON qualification_categories FOR ALL USING (has_permission(auth.uid(), 'manage_qualifications'));

-- Vehicle Types
CREATE POLICY "vehicle_types_select_all" ON vehicle_types FOR SELECT USING (true);
CREATE POLICY "vehicle_types_manage" ON vehicle_types FOR ALL USING (has_permission(auth.uid(), 'manage_vehicles'));

-- Absence Categories
CREATE POLICY "absence_categories_select_all" ON absence_categories FOR SELECT USING (true);
CREATE POLICY "absence_categories_manage" ON absence_categories FOR ALL USING (has_permission(auth.uid(), 'system_admin'));

-- Tour Types
CREATE POLICY "tour_types_select_all" ON tour_types FOR SELECT USING (true);
CREATE POLICY "tour_types_manage" ON tour_types FOR ALL USING (has_permission(auth.uid(), 'edit_shiftplans'));

-- Event Categories
CREATE POLICY "event_categories_select_all" ON event_categories FOR SELECT USING (true);
CREATE POLICY "event_categories_manage" ON event_categories FOR ALL USING (has_permission(auth.uid(), 'manage_events'));

-- Assignments
CREATE POLICY "assignments_select_all" ON assignments FOR SELECT USING (true);
CREATE POLICY "assignments_manage" ON assignments FOR ALL USING (has_permission(auth.uid(), 'manage_assignments'));

-- Qualifications
CREATE POLICY "qualifications_select_all" ON qualifications FOR SELECT USING (true);
CREATE POLICY "qualifications_manage" ON qualifications FOR ALL USING (has_permission(auth.uid(), 'manage_qualifications'));

-- Vehicles
CREATE POLICY "vehicles_select_all" ON vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_manage" ON vehicles FOR ALL USING (
  has_permission(auth.uid(), 'manage_vehicles', vehicles.primary_unit_id) OR
  has_permission(auth.uid(), 'system_admin')
);

-- Absences
CREATE POLICY "absences_select_all" ON absences FOR SELECT USING (true);
CREATE POLICY "absences_manage" ON absences FOR ALL USING (has_permission(auth.uid(), 'system_admin'));

-- Event Groups
CREATE POLICY "event_groups_select_all" ON event_groups FOR SELECT USING (true);
CREATE POLICY "event_groups_manage" ON event_groups FOR ALL USING (has_permission(auth.uid(), 'manage_events'));

-- ============================================================================
-- USER RELATIONSHIP POLICIES
-- ============================================================================

-- User Qualifications
CREATE POLICY "user_qualifications_select_all" ON user_qualifications FOR SELECT USING (true);
CREATE POLICY "user_qualifications_update_own" ON user_qualifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_qualifications_manage" ON user_qualifications FOR ALL USING (has_permission(auth.uid(), 'manage_members'));

-- User Assignments
CREATE POLICY "user_assignments_select_all" ON user_assignments FOR SELECT USING (true);
CREATE POLICY "user_assignments_manage" ON user_assignments FOR ALL USING (
  has_permission(auth.uid(), 'manage_members', user_assignments.unit_id) OR
  has_permission(auth.uid(), 'system_admin')
);

-- User Absences
CREATE POLICY "user_absences_select_all" ON user_absences FOR SELECT USING (true);
CREATE POLICY "user_absences_manage_own" ON user_absences FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.id = user_absences.user_assignment_id
      AND ua.user_id = auth.uid()
  )
);
CREATE POLICY "user_absences_manage_admin" ON user_absences FOR ALL USING (
  has_permission(auth.uid(), 'manage_members') OR
  has_permission(auth.uid(), 'system_admin')
);

-- ============================================================================
-- SHIFTPLAN POLICIES
-- ============================================================================

-- Shiftplans
CREATE POLICY "shiftplans_select" ON shiftplans FOR SELECT USING (
  has_permission(auth.uid(), 'view_shiftplans', shiftplans.unit_id) OR
  has_permission(auth.uid(), 'system_admin')
);
CREATE POLICY "shiftplans_manage" ON shiftplans FOR ALL USING (
  has_permission(auth.uid(), 'edit_shiftplans', shiftplans.unit_id) OR
  has_permission(auth.uid(), 'system_admin')
);

-- Tours
CREATE POLICY "tours_select" ON tours FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shiftplans sp
    WHERE sp.id = tours.shiftplan_id
      AND (has_permission(auth.uid(), 'view_shiftplans', sp.unit_id) OR has_permission(auth.uid(), 'system_admin'))
  )
);
CREATE POLICY "tours_manage" ON tours FOR ALL USING (
  EXISTS (
    SELECT 1 FROM shiftplans sp
    WHERE sp.id = tours.shiftplan_id
      AND (has_permission(auth.uid(), 'edit_shiftplans', sp.unit_id) OR has_permission(auth.uid(), 'system_admin'))
  )
);

-- ============================================================================
-- EVENT POLICIES
-- ============================================================================

-- Events
CREATE POLICY "events_select_all" ON events FOR SELECT USING (
  has_permission(auth.uid(), 'view_events') OR
  has_permission(auth.uid(), 'system_admin')
);
CREATE POLICY "events_create" ON events FOR INSERT WITH CHECK (
  has_permission(auth.uid(), 'create_events') OR
  has_permission(auth.uid(), 'system_admin')
);
CREATE POLICY "events_manage" ON events FOR UPDATE USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);
CREATE POLICY "events_delete" ON events FOR DELETE USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- Event Positions
CREATE POLICY "event_positions_select_all" ON event_positions FOR SELECT USING (true);
CREATE POLICY "event_positions_manage" ON event_positions FOR ALL USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- Event Registrations
CREATE POLICY "event_registrations_select_all" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "event_registrations_insert_own" ON event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "event_registrations_update_own" ON event_registrations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "event_registrations_delete_own" ON event_registrations FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "event_registrations_manage" ON event_registrations FOR ALL USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- Admin Events
CREATE POLICY "admin_events_select_all" ON admin_events FOR SELECT USING (true);
CREATE POLICY "admin_events_manage" ON admin_events FOR ALL USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- ============================================================================
-- NEWS POLICIES
-- ============================================================================

CREATE POLICY "news_select_targeted" ON news FOR SELECT USING (
  -- All users can see news targeted to their units or global news
  target_unit_ids IS NULL OR
  EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.user_id = auth.uid()
      AND ua.unit_id = ANY(target_unit_ids)
  )
);
CREATE POLICY "news_manage" ON news FOR ALL USING (
  has_permission(auth.uid(), 'manage_news') OR
  has_permission(auth.uid(), 'system_admin')
);

-- News Attachments
CREATE POLICY "news_attachments_select_all" ON news_attachments FOR SELECT USING (true);
CREATE POLICY "news_attachments_manage" ON news_attachments FOR ALL USING (
  has_permission(auth.uid(), 'manage_news') OR
  has_permission(auth.uid(), 'system_admin')
);

-- News Read Status
CREATE POLICY "news_read_status_select_own" ON news_read_status FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "news_read_status_insert_own" ON news_read_status FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "news_read_status_update_own" ON news_read_status FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- NEW TABLE POLICIES
-- ============================================================================

-- Quick Links
CREATE POLICY "quick_links_select_all" ON quick_links FOR SELECT USING (is_active = true);
CREATE POLICY "quick_links_manage" ON quick_links FOR ALL USING (
  has_permission(auth.uid(), 'system_admin')
);

-- Temp Users
CREATE POLICY "temp_users_select_all" ON temp_users FOR SELECT USING (true);
CREATE POLICY "temp_users_manage" ON temp_users FOR ALL USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- Event Switch Requests
CREATE POLICY "event_switch_requests_select_all" ON event_switch_requests FOR SELECT USING (true);
CREATE POLICY "event_switch_requests_create_own" ON event_switch_requests FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);
CREATE POLICY "event_switch_requests_manage_own" ON event_switch_requests FOR UPDATE USING (
  requester_id = auth.uid() OR target_id = auth.uid()
);
CREATE POLICY "event_switch_requests_manage_admin" ON event_switch_requests FOR ALL USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- Event Dashboard Sessions
CREATE POLICY "event_dashboard_sessions_select_all" ON event_dashboard_sessions FOR SELECT USING (true);
CREATE POLICY "event_dashboard_sessions_create" ON event_dashboard_sessions FOR INSERT WITH CHECK (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);
CREATE POLICY "event_dashboard_sessions_manage" ON event_dashboard_sessions FOR ALL USING (
  has_permission(auth.uid(), 'manage_events') OR
  has_permission(auth.uid(), 'system_admin')
);

-- Monthly Statistics (read-only, managed by triggers)
CREATE POLICY "monthly_statistics_select_all" ON monthly_statistics FOR SELECT USING (
  has_permission(auth.uid(), 'view_statistics') OR
  has_permission(auth.uid(), 'system_admin')
);

-- ============================================================================
-- UPDATE REALTIME PUBLICATION
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE quick_links;
ALTER PUBLICATION supabase_realtime ADD TABLE news_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE news_read_status;
ALTER PUBLICATION supabase_realtime ADD TABLE temp_users;
ALTER PUBLICATION supabase_realtime ADD TABLE event_switch_requests;
