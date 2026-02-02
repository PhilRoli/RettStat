-- RettStat Database Schema v2 - Functions and Triggers
-- Created: 2026-02-02

-- ============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_create_profile();

COMMENT ON FUNCTION auto_create_profile IS 'Automatically create a profile when a user signs up';

-- ============================================================================
-- VALIDATE USER ABSENCE DATES
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_absence_dates()
RETURNS TRIGGER AS $$
DECLARE
  assignment_start_date DATE;
BEGIN
  -- Get the assignment start date
  SELECT assigned_date INTO assignment_start_date
  FROM user_assignments
  WHERE id = NEW.user_assignment_id;

  -- Validate start_date is not before assignment start
  IF NEW.start_date < assignment_start_date THEN
    RAISE EXCEPTION 'Absence start date (%) cannot be before assignment start date (%)', 
      NEW.start_date, assignment_start_date;
  END IF;

  -- If end_date is provided, validate it's after start_date
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'Absence end date (%) cannot be before start date (%)', 
      NEW.end_date, NEW.start_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_user_absence_dates
  BEFORE INSERT OR UPDATE ON user_absences
  FOR EACH ROW EXECUTE FUNCTION validate_absence_dates();

COMMENT ON FUNCTION validate_absence_dates IS 'Ensure absence dates fall within assignment period';

-- ============================================================================
-- AUTO-UPDATE EVENT POSITION COUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_position_counts()
RETURNS TRIGGER AS $$
DECLARE
  position_id UUID;
BEGIN
  -- Determine which position to update
  IF TG_OP = 'DELETE' THEN
    position_id := OLD.event_position_id;
  ELSE
    position_id := NEW.event_position_id;
  END IF;

  -- Skip if no position assigned
  IF position_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update the filled count for the position
  UPDATE event_positions
  SET quantity_filled = (
    SELECT COUNT(*)
    FROM event_registrations
    WHERE event_position_id = position_id
      AND status IN ('registered', 'confirmed', 'attended')
  )
  WHERE id = position_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_position_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_event_position_counts();

COMMENT ON FUNCTION update_event_position_counts IS 'Automatically update event position filled counts';

-- ============================================================================
-- CALCULATE MONTHLY STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_monthly_stats(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS void AS $$
DECLARE
  v_total_shifts INTEGER;
  v_total_hours NUMERIC;
  v_total_events INTEGER;
BEGIN
  -- Calculate shift statistics from tours
  SELECT 
    COUNT(DISTINCT t.shiftplan_id),
    COALESCE(SUM(EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600), 0)
  INTO v_total_shifts, v_total_hours
  FROM tours t
  WHERE (t.driver_id = p_user_id OR t.lead_id = p_user_id OR t.student_id = p_user_id)
    AND EXTRACT(YEAR FROM t.start_time) = p_year
    AND EXTRACT(MONTH FROM t.start_time) = p_month;

  -- Calculate event statistics
  SELECT COUNT(DISTINCT er.event_id)
  INTO v_total_events
  FROM event_registrations er
  JOIN events e ON er.event_id = e.id
  WHERE er.user_id = p_user_id
    AND er.status IN ('confirmed', 'attended')
    AND EXTRACT(YEAR FROM e.start_time) = p_year
    AND EXTRACT(MONTH FROM e.start_time) = p_month;

  -- Upsert statistics
  INSERT INTO monthly_statistics (user_id, year, month, total_shifts, total_hours, total_events)
  VALUES (p_user_id, p_year, p_month, v_total_shifts, v_total_hours, v_total_events)
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_shifts = EXCLUDED.total_shifts,
    total_hours = EXCLUDED.total_hours,
    total_events = EXCLUDED.total_events,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_user_monthly_stats IS 'Calculate and update monthly statistics for a user';

-- ============================================================================
-- TRIGGER TO UPDATE STATISTICS ON TOUR CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_monthly_stats()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_ids UUID[];
  affected_year INTEGER;
  affected_month INTEGER;
  user_id UUID;
BEGIN
  -- Determine affected users and time period
  IF TG_OP = 'DELETE' THEN
    affected_user_ids := ARRAY[OLD.driver_id, OLD.lead_id, OLD.student_id];
    affected_year := EXTRACT(YEAR FROM OLD.start_time);
    affected_month := EXTRACT(MONTH FROM OLD.start_time);
  ELSE
    affected_user_ids := ARRAY[NEW.driver_id, NEW.lead_id, NEW.student_id];
    affected_year := EXTRACT(YEAR FROM NEW.start_time);
    affected_month := EXTRACT(MONTH FROM NEW.start_time);
  END IF;

  -- Update statistics for each affected user
  FOREACH user_id IN ARRAY affected_user_ids
  LOOP
    IF user_id IS NOT NULL THEN
      PERFORM calculate_user_monthly_stats(user_id, affected_year, affected_month);
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_tour_change
  AFTER INSERT OR UPDATE OR DELETE ON tours
  FOR EACH ROW EXECUTE FUNCTION trigger_update_monthly_stats();

COMMENT ON FUNCTION trigger_update_monthly_stats IS 'Trigger to recalculate statistics when tours change';

-- ============================================================================
-- STATISTICS QUERY FUNCTIONS
-- ============================================================================

-- Get user statistics for a date range
CREATE OR REPLACE FUNCTION get_user_statistics(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_shifts BIGINT,
  total_hours NUMERIC,
  total_events BIGINT,
  average_shift_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT t.shiftplan_id)::BIGINT,
    COALESCE(SUM(EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600), 0)::NUMERIC,
    (SELECT COUNT(DISTINCT er.event_id)
     FROM event_registrations er
     JOIN events e ON er.event_id = e.id
     WHERE er.user_id = p_user_id
       AND er.status IN ('confirmed', 'attended')
       AND (p_start_date IS NULL OR e.start_time >= p_start_date)
       AND (p_end_date IS NULL OR e.start_time <= p_end_date))::BIGINT,
    CASE 
      WHEN COUNT(DISTINCT t.shiftplan_id) > 0 THEN
        (SUM(EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600) / COUNT(DISTINCT t.shiftplan_id))::NUMERIC
      ELSE 0::NUMERIC
    END
  FROM tours t
  WHERE (t.driver_id = p_user_id OR t.lead_id = p_user_id OR t.student_id = p_user_id)
    AND (p_start_date IS NULL OR t.start_time >= p_start_date)
    AND (p_end_date IS NULL OR t.start_time <= p_end_date);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_statistics IS 'Get user statistics for a specific date range';

-- Get unit-wide statistics for a date range
CREATE OR REPLACE FUNCTION get_unit_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_users BIGINT,
  total_shifts BIGINT,
  total_hours NUMERIC,
  total_events BIGINT,
  average_shifts_per_user NUMERIC,
  average_hours_per_user NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_counts AS (
    SELECT COUNT(DISTINCT id) as active_users
    FROM profiles
    WHERE is_active = true
  ),
  shift_stats AS (
    SELECT 
      COUNT(DISTINCT sp.id) as shifts,
      COALESCE(SUM(EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600), 0) as hours
    FROM shiftplans sp
    JOIN tours t ON t.shiftplan_id = sp.id
    WHERE (p_start_date IS NULL OR sp.start_time >= p_start_date)
      AND (p_end_date IS NULL OR sp.start_time <= p_end_date)
  ),
  event_stats AS (
    SELECT COUNT(DISTINCT id) as events
    FROM events
    WHERE (p_start_date IS NULL OR start_time >= p_start_date)
      AND (p_end_date IS NULL OR start_time <= p_end_date)
  )
  SELECT 
    uc.active_users::BIGINT,
    ss.shifts::BIGINT,
    ss.hours::NUMERIC,
    es.events::BIGINT,
    CASE WHEN uc.active_users > 0 THEN (ss.shifts::NUMERIC / uc.active_users) ELSE 0::NUMERIC END,
    CASE WHEN uc.active_users > 0 THEN (ss.hours::NUMERIC / uc.active_users) ELSE 0::NUMERIC END
  FROM user_counts uc, shift_stats ss, event_stats es;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_unit_statistics IS 'Get organization-wide statistics for a specific date range';

-- Check for expiring qualifications
CREATE OR REPLACE FUNCTION check_expiring_qualifications(
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  qualification_name TEXT,
  obtained_date DATE,
  days_since_obtained INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    q.name,
    uq.obtained_date,
    (CURRENT_DATE - uq.obtained_date)::INTEGER
  FROM user_qualifications uq
  JOIN profiles p ON uq.user_id = p.id
  JOIN qualifications q ON uq.qualification_id = q.id
  WHERE p.is_active = true
  ORDER BY uq.obtained_date;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_expiring_qualifications IS 'Get list of user qualifications (no expiration in v2, but kept for compatibility)';
