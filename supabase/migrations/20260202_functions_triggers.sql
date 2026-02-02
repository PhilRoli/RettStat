-- RettStat Database Functions and Triggers
-- Phase 4: Automation and computed values

-- ============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- ============================================================================
-- UPDATE EVENT POSITION FILLED COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_event_position_filled_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE event_positions
    SET quantity_filled = (
      SELECT COUNT(*)
      FROM event_registrations
      WHERE event_position_id = NEW.event_position_id
        AND status IN ('registered', 'confirmed', 'attended')
    )
    WHERE id = NEW.event_position_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE event_positions
    SET quantity_filled = (
      SELECT COUNT(*)
      FROM event_registrations
      WHERE event_position_id = OLD.event_position_id
        AND status IN ('registered', 'confirmed', 'attended')
    )
    WHERE id = OLD.event_position_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_count_on_registration
  AFTER INSERT OR UPDATE OR DELETE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_position_filled_count();

-- ============================================================================
-- CALCULATE MONTHLY STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_monthly_statistics(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_total_shifts INTEGER;
  v_total_hours NUMERIC;
  v_total_events INTEGER;
BEGIN
  -- Calculate shift statistics
  SELECT 
    COUNT(*),
    COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)
  INTO v_total_shifts, v_total_hours
  FROM shifts
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM start_time) = p_year
    AND EXTRACT(MONTH FROM start_time) = p_month
    AND status IN ('confirmed', 'completed');

  -- Calculate event statistics
  SELECT COUNT(*)
  INTO v_total_events
  FROM event_registrations er
  JOIN events e ON e.id = er.event_id
  WHERE er.user_id = p_user_id
    AND EXTRACT(YEAR FROM e.start_time) = p_year
    AND EXTRACT(MONTH FROM e.start_time) = p_month
    AND er.status IN ('confirmed', 'attended');

  -- Insert or update statistics
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

-- ============================================================================
-- TRIGGER TO UPDATE STATISTICS ON SHIFT CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_shift_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics for the affected month
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM calculate_monthly_statistics(
      NEW.user_id,
      EXTRACT(YEAR FROM NEW.start_time)::INTEGER,
      EXTRACT(MONTH FROM NEW.start_time)::INTEGER
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_monthly_statistics(
      OLD.user_id,
      EXTRACT(YEAR FROM OLD.start_time)::INTEGER,
      EXTRACT(MONTH FROM OLD.start_time)::INTEGER
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_statistics_on_shift_change
  AFTER INSERT OR UPDATE OR DELETE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_shift_statistics();

-- ============================================================================
-- GET USER STATISTICS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_statistics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
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
    COUNT(DISTINCT s.id) as total_shifts,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours,
    COUNT(DISTINCT er.id) as total_events,
    COALESCE(AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as average_shift_hours
  FROM shifts s
  FULL OUTER JOIN event_registrations er ON er.user_id = p_user_id
  FULL OUTER JOIN events e ON e.id = er.event_id
  WHERE s.user_id = p_user_id
    AND s.status IN ('confirmed', 'completed')
    AND (p_start_date IS NULL OR s.start_time >= p_start_date)
    AND (p_end_date IS NULL OR s.start_time <= p_end_date)
    AND (er.id IS NULL OR (
      er.status IN ('confirmed', 'attended')
      AND (p_start_date IS NULL OR e.start_time >= p_start_date)
      AND (p_end_date IS NULL OR e.start_time <= p_end_date)
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CHECK QUALIFICATION EXPIRATION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_expiring_qualifications(p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  qualification_name TEXT,
  expiration_date DATE,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uq.user_id,
    p.full_name,
    q.name,
    uq.expiration_date,
    (uq.expiration_date - CURRENT_DATE)::INTEGER
  FROM user_qualifications uq
  JOIN profiles p ON p.id = uq.user_id
  JOIN qualifications q ON q.id = uq.qualification_id
  WHERE uq.expiration_date IS NOT NULL
    AND uq.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
    AND p.is_active = true
  ORDER BY uq.expiration_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GET UNIT STATISTICS (FOR ADMINS/MANAGERS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unit_statistics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
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
  SELECT 
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT s.id) as total_shifts,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours,
    COUNT(DISTINCT e.id) as total_events,
    CASE 
      WHEN COUNT(DISTINCT p.id) > 0 
      THEN COUNT(DISTINCT s.id)::NUMERIC / COUNT(DISTINCT p.id)
      ELSE 0 
    END as average_shifts_per_user,
    CASE 
      WHEN COUNT(DISTINCT p.id) > 0 
      THEN COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) / COUNT(DISTINCT p.id)
      ELSE 0 
    END as average_hours_per_user
  FROM profiles p
  LEFT JOIN shifts s ON s.user_id = p.id 
    AND s.status IN ('confirmed', 'completed')
    AND (p_start_date IS NULL OR s.start_time >= p_start_date)
    AND (p_end_date IS NULL OR s.start_time <= p_end_date)
  LEFT JOIN events e ON (p_start_date IS NULL OR e.start_time >= p_start_date)
    AND (p_end_date IS NULL OR e.start_time <= p_end_date)
  WHERE p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION create_profile_for_user IS 'Automatically creates a profile when a user signs up';
COMMENT ON FUNCTION update_event_position_filled_count IS 'Updates the filled count for event positions when registrations change';
COMMENT ON FUNCTION calculate_monthly_statistics IS 'Calculates and caches monthly statistics for a user';
COMMENT ON FUNCTION get_user_statistics IS 'Retrieves user statistics for a date range';
COMMENT ON FUNCTION check_expiring_qualifications IS 'Returns qualifications expiring within the specified days';
COMMENT ON FUNCTION get_unit_statistics IS 'Retrieves unit-wide statistics for admins/managers';
