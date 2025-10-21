-- Your triggers
SELECT trigger_name, table_name, status, triggering_event
FROM user_triggers;

-- Your sequences
SELECT sequence_name, min_value, max_value, increment_by, last_number
FROM user_sequences;

-- Your constraints
SELECT constraint_name, table_name, constraint_type
FROM user_constraints;
