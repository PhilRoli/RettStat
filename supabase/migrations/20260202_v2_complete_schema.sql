-- RettStat Database Schema v2
-- Complete database schema with all tables, constraints, and indexes
-- Created: 2026-02-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Units table (organizational hierarchy)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE units IS 'Organizational units with hierarchical structure';
COMMENT ON COLUMN units.parent_unit_id IS 'Self-referential for unit hierarchy (e.g., station -> district -> region)';

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  service_id TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN profiles.service_id IS 'Internal service/employee ID';
COMMENT ON COLUMN profiles.role IS 'User role: admin (full access), manager (can manage shifts/events), member (basic access)';

-- ============================================================================
-- CATEGORY TABLES (Master Data)
-- ============================================================================

-- Assignment categories
CREATE TABLE assignment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assignment_categories IS 'Categories for assignments (operational, administrative, training, etc.)';

-- Qualification categories
CREATE TABLE qualification_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE qualification_categories IS 'Categories for qualifications (medical, driver, leadership, etc.)';

-- Vehicle types
CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vehicle_types IS 'Types of vehicles (ambulance, command vehicle, support, etc.)';

-- Absence categories
CREATE TABLE absence_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE absence_categories IS 'Categories for absences (vacation, sick leave, training, etc.)';

-- Tour types
CREATE TABLE tour_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tour_types IS 'Types of tours (emergency response, standby, training, etc.)';

-- Event categories
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_categories IS 'Top-level event categorization with custom ordering';

-- ============================================================================
-- ENTITY TABLES
-- ============================================================================

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES assignment_categories(id) ON DELETE SET NULL,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('station', 'vehicle', 'team', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assignments IS 'Assignments (stations, vehicles, teams) with categories';

-- Qualifications
CREATE TABLE qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  abbreviation TEXT,
  category_id UUID REFERENCES qualification_categories(id) ON DELETE SET NULL,
  level INTEGER,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE qualifications IS 'Qualifications/certifications with categories and levels';
COMMENT ON COLUMN qualifications.level IS 'Qualification level (1=basic, 2=intermediate, 3=advanced, etc.)';

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id) ON DELETE RESTRICT,
  call_sign TEXT NOT NULL,
  primary_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  secondary_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vehicles IS 'Individual vehicles with type and unit assignments';
COMMENT ON COLUMN vehicles.call_sign IS 'Radio call sign or vehicle identifier';

-- Absences (master data)
CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES absence_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE absences IS 'Types of absences available in the system (master data)';

-- Event groups
CREATE TABLE event_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  is_admin_group BOOLEAN DEFAULT FALSE,
  is_break_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_groups IS 'Groups for event positions (admin groups and break groups have special handling)';

-- ============================================================================
-- USER RELATIONSHIP TABLES
-- ============================================================================

-- User qualifications
CREATE TABLE user_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualification_id UUID NOT NULL REFERENCES qualifications(id) ON DELETE RESTRICT,
  obtained_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, qualification_id)
);

COMMENT ON TABLE user_qualifications IS 'User qualifications with obtained date (no expiration)';

-- User assignments
CREATE TABLE user_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_assignments IS 'User assignments to stations/teams/etc with unit (no end date - ongoing)';
COMMENT ON COLUMN user_assignments.is_primary IS 'Primary assignment flag (user can have multiple assignments)';

-- User absences
CREATE TABLE user_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_assignment_id UUID NOT NULL REFERENCES user_assignments(id) ON DELETE CASCADE,
  absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_absences IS 'User absences within assignments (dates must be within assignment period)';

-- ============================================================================
-- SHIFTPLAN TABLES
-- ============================================================================

-- Shiftplans (container for tours)
CREATE TABLE shiftplans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  shift_lead_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

COMMENT ON TABLE shiftplans IS 'Shift containers (typically 11-14 tours per shift)';

-- Tours (individual assignments within shiftplan)
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shiftplan_id UUID NOT NULL REFERENCES shiftplans(id) ON DELETE CASCADE,
  tour_type_id UUID REFERENCES tour_types(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  name TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

COMMENT ON TABLE tours IS 'Individual tours within a shiftplan (driver, lead, student are all user IDs)';

-- ============================================================================
-- EVENT TABLES
-- ============================================================================

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

COMMENT ON TABLE events IS 'Events with category-based organization';

-- Event positions
CREATE TABLE event_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_id UUID REFERENCES event_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  minimum_qualification_ids UUID[],
  is_group_lead BOOLEAN DEFAULT FALSE,
  quantity_needed INTEGER DEFAULT 1 CHECK (quantity_needed > 0),
  quantity_filled INTEGER DEFAULT 0 CHECK (quantity_filled >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_positions IS 'Positions within events with groups and multiple qualification requirements';
COMMENT ON COLUMN event_positions.minimum_qualification_ids IS 'Array of qualification IDs required for this position';

-- Event registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_position_id UUID REFERENCES event_positions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, event_position_id, user_id)
);

COMMENT ON TABLE event_registrations IS 'User registrations for event positions';

-- Admin events (notes about what happened)
CREATE TABLE admin_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE admin_events IS 'Admin notes about incidents/issues/observations during events';

-- ============================================================================
-- NEWS & STATISTICS TABLES
-- ============================================================================

-- News
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'emergency', 'training', 'event', 'maintenance', 'policy')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE news IS 'News and announcements with priority and scheduling';

-- Monthly statistics
CREATE TABLE monthly_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  total_shifts INTEGER DEFAULT 0,
  total_hours NUMERIC(10, 2) DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

COMMENT ON TABLE monthly_statistics IS 'Pre-computed monthly statistics for performance';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Units indexes
CREATE INDEX idx_units_parent ON units(parent_unit_id);

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- Assignments indexes
CREATE INDEX idx_assignments_category ON assignments(category_id);
CREATE INDEX idx_assignments_is_active ON assignments(is_active);

-- Qualifications indexes
CREATE INDEX idx_qualifications_category ON qualifications(category_id);
CREATE INDEX idx_qualifications_is_active ON qualifications(is_active);

-- Vehicles indexes
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type_id);
CREATE INDEX idx_vehicles_primary_unit ON vehicles(primary_unit_id);
CREATE INDEX idx_vehicles_secondary_unit ON vehicles(secondary_unit_id);

-- User relationships indexes
CREATE INDEX idx_user_qualifications_user ON user_qualifications(user_id);
CREATE INDEX idx_user_qualifications_qualification ON user_qualifications(qualification_id);
CREATE INDEX idx_user_assignments_user ON user_assignments(user_id);
CREATE INDEX idx_user_assignments_assignment ON user_assignments(assignment_id);
CREATE INDEX idx_user_assignments_unit ON user_assignments(unit_id);
CREATE INDEX idx_user_absences_assignment ON user_absences(user_assignment_id);
CREATE INDEX idx_user_absences_dates ON user_absences(start_date, end_date);

-- Shiftplan indexes
CREATE INDEX idx_shiftplans_unit ON shiftplans(unit_id);
CREATE INDEX idx_shiftplans_lead ON shiftplans(shift_lead_id);
CREATE INDEX idx_shiftplans_times ON shiftplans(start_time, end_time);
CREATE INDEX idx_tours_shiftplan ON tours(shiftplan_id);
CREATE INDEX idx_tours_vehicle ON tours(vehicle_id);
CREATE INDEX idx_tours_times ON tours(start_time, end_time);

-- Event indexes
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_times ON events(start_time, end_time);
CREATE INDEX idx_event_positions_event ON event_positions(event_id);
CREATE INDEX idx_event_positions_group ON event_positions(group_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_position ON event_registrations(event_position_id);
CREATE INDEX idx_admin_events_event ON admin_events(event_id);

-- News indexes
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_priority ON news(priority);
CREATE INDEX idx_news_published ON news(published_at);
CREATE INDEX idx_news_is_pinned ON news(is_pinned);

-- Statistics indexes
CREATE INDEX idx_monthly_statistics_user ON monthly_statistics(user_id);
CREATE INDEX idx_monthly_statistics_period ON monthly_statistics(year, month);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_categories_updated_at BEFORE UPDATE ON assignment_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qualification_categories_updated_at BEFORE UPDATE ON qualification_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_types_updated_at BEFORE UPDATE ON vehicle_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_absence_categories_updated_at BEFORE UPDATE ON absence_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tour_types_updated_at BEFORE UPDATE ON tour_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON event_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qualifications_updated_at BEFORE UPDATE ON qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_absences_updated_at BEFORE UPDATE ON absences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_groups_updated_at BEFORE UPDATE ON event_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_qualifications_updated_at BEFORE UPDATE ON user_qualifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_assignments_updated_at BEFORE UPDATE ON user_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_absences_updated_at BEFORE UPDATE ON user_absences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shiftplans_updated_at BEFORE UPDATE ON shiftplans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_positions_updated_at BEFORE UPDATE ON event_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_statistics_updated_at BEFORE UPDATE ON monthly_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
