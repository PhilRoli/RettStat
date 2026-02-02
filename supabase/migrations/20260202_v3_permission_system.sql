-- RettStat Database Schema v3 - Permission System
-- Major Update: Replace role-based system with granular permission system
-- Created: 2026-02-02

-- ============================================================================
-- PERMISSION SYSTEM TABLES
-- ============================================================================

-- Permissions table (master data)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Available permissions in the system';

-- Seed initial permissions
INSERT INTO permissions (name, description) VALUES
  ('view_shiftplans', 'View shiftplans in unit'),
  ('edit_shiftplans', 'Create and edit shiftplans in unit'),
  ('view_statistics', 'View statistics in unit'),
  ('view_events', 'View events'),
  ('create_events', 'Create new events'),
  ('manage_events', 'Manage any event (assign users, edit details)'),
  ('view_members', 'View member list in unit'),
  ('manage_members', 'Edit member data in unit'),
  ('manage_qualifications', 'Manage qualification types and categories'),
  ('manage_assignments', 'Manage assignment types and categories'),
  ('manage_vehicles', 'Manage vehicles in unit'),
  ('manage_units', 'Create and edit units'),
  ('manage_news', 'Create and edit news'),
  ('system_admin', 'Full system access (superuser)');

-- User permissions (permission grants per unit)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_id, unit_id)
);

COMMENT ON TABLE user_permissions IS 'User permissions per unit (null unit_id = global permission)';
COMMENT ON COLUMN user_permissions.unit_id IS 'Unit where permission applies (null = global, inherits to sub-units)';

-- Assignment default permissions (which permissions assignments grant)
CREATE TABLE assignment_default_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, permission_id)
);

COMMENT ON TABLE assignment_default_permissions IS 'Default permissions granted by assignments (configurable in admin panel)';

-- ============================================================================
-- NEWS & ATTACHMENTS UPDATES
-- ============================================================================

-- Add target units to news
ALTER TABLE news ADD COLUMN target_unit_ids UUID[];
COMMENT ON COLUMN news.target_unit_ids IS 'Units that can see this news (null = all units)';

-- News attachments
CREATE TABLE news_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE news_attachments IS 'File attachments for news (stored in Supabase Storage)';

-- News read status tracking
CREATE TABLE news_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(news_id, user_id)
);

COMMENT ON TABLE news_read_status IS 'Track which users have read which news';

-- ============================================================================
-- VEHICLE & CONFIG UPDATES
-- ============================================================================

-- Add color to vehicle types (for calendar/statistics display)
ALTER TABLE vehicle_types ADD COLUMN color TEXT;
COMMENT ON COLUMN vehicle_types.color IS 'Color for visual identification (hex code)';

-- Quick links (admin-configurable home page links)
CREATE TABLE quick_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT,
  phone TEXT,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((url IS NOT NULL) OR (phone IS NOT NULL))
);

COMMENT ON TABLE quick_links IS 'Configurable quick links for home page';
COMMENT ON COLUMN quick_links.url IS 'URL for web links (mutually exclusive with phone)';
COMMENT ON COLUMN quick_links.phone IS 'Phone number for tel: links (mutually exclusive with url)';

-- ============================================================================
-- EVENT & TEMP USERS UPDATES
-- ============================================================================

-- Add self-assignment controls to events
ALTER TABLE events ADD COLUMN allow_self_assign BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN allow_self_assign_after_break BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN restrict_to_admins BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN events.allow_self_assign IS 'Users can assign themselves to positions';
COMMENT ON COLUMN events.allow_self_assign_after_break IS 'Users in break groups can self-assign to non-break positions';
COMMENT ON COLUMN events.restrict_to_admins IS 'Only admins/managers can assign users';

-- Temporary users (reusable placeholders)
CREATE TABLE temp_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE temp_users IS 'Temporary user placeholders for events (reusable across events)';

-- Add temp user support to event registrations
ALTER TABLE event_registrations ADD COLUMN temp_user_id UUID REFERENCES temp_users(id) ON DELETE CASCADE;
ALTER TABLE event_registrations ADD COLUMN assigned_at TIMESTAMPTZ;
ALTER TABLE event_registrations ADD CONSTRAINT user_or_temp_user CHECK (
  (user_id IS NOT NULL AND temp_user_id IS NULL) OR
  (user_id IS NULL AND temp_user_id IS NOT NULL)
);

COMMENT ON COLUMN event_registrations.temp_user_id IS 'Temporary user placeholder (mutually exclusive with user_id)';
COMMENT ON COLUMN event_registrations.assigned_at IS 'When user/temp_user was assigned to this position';

-- Drop old unique constraint and create new one
ALTER TABLE event_registrations DROP CONSTRAINT event_registrations_event_id_event_position_id_user_id_key;
CREATE UNIQUE INDEX event_registrations_user_unique ON event_registrations(event_id, event_position_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX event_registrations_temp_user_unique ON event_registrations(event_id, event_position_id, temp_user_id) WHERE temp_user_id IS NOT NULL;

-- Event switch requests
CREATE TABLE event_switch_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_position_id UUID NOT NULL REFERENCES event_positions(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_position_id UUID NOT NULL REFERENCES event_positions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_switch_requests IS 'Requests to swap positions between users in events';

-- Event dashboard sessions (for QR code verification)
CREATE TABLE event_dashboard_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL,
  device_token TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_dashboard_sessions IS 'Dashboard sessions for TV/large screen display with QR code verification';
COMMENT ON COLUMN event_dashboard_sessions.session_code IS '6-character verification code shown on admin device';

-- ============================================================================
-- PROFILES TABLE UPDATES
-- ============================================================================

-- Remove role column (replaced by permission system)
ALTER TABLE profiles DROP COLUMN role;

-- Add notification preferences
ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": {"shifts": true, "events": true, "news": true}, "push": {"shifts": false, "events": false, "news": false}}'::jsonb;

COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences for email and push (shifts, events, news)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Permission system indexes
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_unit ON user_permissions(unit_id);
CREATE INDEX idx_assignment_default_permissions_assignment ON assignment_default_permissions(assignment_id);
CREATE INDEX idx_assignment_default_permissions_permission ON assignment_default_permissions(permission_id);

-- News indexes
CREATE INDEX idx_news_target_units ON news USING GIN(target_unit_ids);
CREATE INDEX idx_news_attachments_news ON news_attachments(news_id);
CREATE INDEX idx_news_read_status_news ON news_read_status(news_id);
CREATE INDEX idx_news_read_status_user ON news_read_status(user_id);

-- Quick links indexes
CREATE INDEX idx_quick_links_order ON quick_links("order");
CREATE INDEX idx_quick_links_is_active ON quick_links(is_active);

-- Temp users indexes
CREATE INDEX idx_temp_users_created_by ON temp_users(created_by);

-- Event indexes
CREATE INDEX idx_event_registrations_temp_user ON event_registrations(temp_user_id);
CREATE INDEX idx_event_switch_requests_event ON event_switch_requests(event_id);
CREATE INDEX idx_event_switch_requests_requester ON event_switch_requests(requester_id);
CREATE INDEX idx_event_switch_requests_target ON event_switch_requests(target_id);
CREATE INDEX idx_event_switch_requests_status ON event_switch_requests(status);
CREATE INDEX idx_event_dashboard_sessions_event ON event_dashboard_sessions(event_id);
CREATE INDEX idx_event_dashboard_sessions_code ON event_dashboard_sessions(session_code);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_quick_links_updated_at BEFORE UPDATE ON quick_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_temp_users_updated_at BEFORE UPDATE ON temp_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_switch_requests_updated_at BEFORE UPDATE ON event_switch_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION: CONVERT EXISTING ROLES TO PERMISSIONS
-- ============================================================================

-- Temporarily add back role column for migration
ALTER TABLE profiles ADD COLUMN role_temp TEXT;
UPDATE profiles SET role_temp = 'member';  -- Default to member since we removed role column

-- Grant system_admin permission to admins (globally)
-- Note: This is a placeholder - actual admin migration would need to be done based on existing data
-- INSERT INTO user_permissions (user_id, permission_id, unit_id)
-- SELECT p.id, perm.id, NULL
-- FROM profiles p
-- CROSS JOIN permissions perm
-- WHERE p.role_temp = 'admin' AND perm.name = 'system_admin';

-- Clean up temp column
ALTER TABLE profiles DROP COLUMN role_temp;
