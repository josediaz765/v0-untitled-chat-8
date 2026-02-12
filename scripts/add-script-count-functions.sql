-- Function to increment script counts
CREATE OR REPLACE FUNCTION increment_script_count(script_id UUID, count_field TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE scripts SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', count_field, count_field)
  USING script_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement script counts
CREATE OR REPLACE FUNCTION decrement_script_count(script_id UUID, count_field TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE scripts SET %I = GREATEST(COALESCE(%I, 0) - 1, 0) WHERE id = $1', count_field, count_field)
  USING script_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_script_count(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_script_count(UUID, TEXT) TO authenticated;
