-- RettStat Database Schema
-- Phase 4: Complete database structure for EMS shift management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES & USERS
-- ============================================================================

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- QUALIFICATIONS & ASSIGNMENTS
-- ============================================================================

-- Qualification types (e.g., EMT-B, EMT-P, Driver's License)
CREATE TABLE qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  abbreviation TEXT,
  color TEXT, -- For visual identification
  requires_renewal BOOLEAN NOT NULL DEFAULT false,
  renewal_period_months INTEGER, -- NULL if no renewal required
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_qualifications_updated_at
  BEFORE UPDATE ON qualifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User qualifications (many-to-many with expiration tracking)
CREATE TABLE user_qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualification_id UUID NOT NULL REFERENCES qualifications(id) ON DELETE CASCADE,
  obtained_date DATE NOT NULL,
  expiration_date DATE, -- NULL if no expiration
  certificate_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, qualification_id)
);

CREATE TRIGGER update_user_qualifications_updated_at
  BEFORE UPDATE ON user_qualifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Assignment types (e.g., Station 1, Ambulance 12, Special Team)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('station', 'vehicle', 'team', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- User assignments (many-to-many)
CREATE TABLE user_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL if current
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, assignment_id, assigned_date)
);

CREATE TRIGGER update_user_assignments_updated_at
  BEFORE UPDATE ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SHIFTS & SHIFT PLANS
-- ============================================================================

-- Shift templates/types
CREATE TABLE shift_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_start_time TIME,
  default_end_time TIME,
  default_duration_hours NUMERIC(4,2),
  color TEXT, -- For calendar display
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_shift_types_updated_at
  BEFORE UPDATE ON shift_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Individual shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_type_id UUID REFERENCES shift_types(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_shift_times CHECK (end_time > start_time)
);

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_shifts_user_id ON shifts(user_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_assignment_id ON shifts(assignment_id);

-- ============================================================================
-- EVENTS & EVENT POSITIONS
-- ============================================================================

-- Events (special operations, community events, etc.)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('emergency', 'training', 'community', 'competition', 'other')),
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_times CHECK (end_time > start_time)
);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);

-- Event positions (roles needed for an event)
CREATE TABLE event_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Driver", "Team Leader", "Medic"
  description TEXT,
  required_qualification_id UUID REFERENCES qualifications(id) ON DELETE SET NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  quantity_filled INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_quantities CHECK (quantity_filled <= quantity_needed)
);

CREATE TRIGGER update_event_positions_updated_at
  BEFORE UPDATE ON event_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Event registrations (who signed up for what position)
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_position_id UUID REFERENCES event_positions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);

-- ============================================================================
-- NEWS & ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'emergency', 'training', 'event', 'maintenance', 'policy')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_news_priority ON news(priority);
CREATE INDEX idx_news_category ON news(category);

-- ============================================================================
-- STATISTICS & AGGREGATIONS
-- (Mostly computed, but we can cache some calculations)
-- ============================================================================

-- Pre-computed monthly statistics for performance
CREATE TABLE monthly_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_shifts INTEGER NOT NULL DEFAULT 0,
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_events INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE TRIGGER update_monthly_statistics_updated_at
  BEFORE UPDATE ON monthly_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_monthly_statistics_user_id ON monthly_statistics(user_id);
CREATE INDEX idx_monthly_statistics_year_month ON monthly_statistics(year, month);

-- ============================================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_user_qualifications_user_id ON user_qualifications(user_id);
CREATE INDEX idx_user_qualifications_expiration_date ON user_qualifications(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_user_assignments_user_id ON user_assignments(user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles with extended information beyond auth.users';
COMMENT ON TABLE qualifications IS 'Available certifications and qualifications';
COMMENT ON TABLE user_qualifications IS 'User-specific qualification records with expiration tracking';
COMMENT ON TABLE assignments IS 'Organizational units (stations, vehicles, teams)';
COMMENT ON TABLE user_assignments IS 'User assignments to organizational units';
COMMENT ON TABLE shift_types IS 'Templates for common shift patterns';
COMMENT ON TABLE shifts IS 'Individual shift records';
COMMENT ON TABLE events IS 'Special events and operations';
COMMENT ON TABLE event_positions IS 'Required positions/roles for events';
COMMENT ON TABLE event_registrations IS 'User sign-ups for event positions';
COMMENT ON TABLE news IS 'Announcements and news items';
COMMENT ON TABLE monthly_statistics IS 'Pre-computed monthly aggregates for performance';
