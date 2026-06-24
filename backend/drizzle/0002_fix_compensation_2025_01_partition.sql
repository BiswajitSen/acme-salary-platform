DO $$
DECLARE
  month_key_value text;
  partition_range_start date;
  partition_range_end date;
  partition_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM compensation_month_partitions
    WHERE month_key = '2025-01'
      AND compensation_month_partitions.range_end = DATE '2026-01-01'
  ) THEN
    ALTER TABLE compensation_history DETACH PARTITION compensation_history_2025_01;
    ALTER TABLE compensation_history_2025_01 RENAME TO compensation_history_2025_01_bad;

    CREATE TABLE compensation_history_2025_01 PARTITION OF compensation_history
      FOR VALUES FROM (DATE '2025-01-01') TO (DATE '2025-02-01');

    FOR month_key_value IN
      SELECT DISTINCT to_char(effective_date, 'YYYY-MM')
      FROM compensation_history_2025_01_bad
      WHERE effective_date >= DATE '2025-02-01'
        AND effective_date < DATE '2026-01-01'
    LOOP
      partition_range_start := to_date(month_key_value || '-01', 'YYYY-MM-DD');
      partition_range_end := (partition_range_start + INTERVAL '1 month')::date;
      partition_name := 'compensation_history_' || replace(month_key_value, '-', '_');

      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF compensation_history FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        partition_range_start,
        partition_range_end
      );

      INSERT INTO compensation_month_partitions (
        month_key,
        partition_table_name,
        range_start,
        range_end
      )
      VALUES (
        month_key_value,
        partition_name,
        partition_range_start,
        partition_range_end
      )
      ON CONFLICT (month_key) DO NOTHING;
    END LOOP;

    INSERT INTO compensation_history
    SELECT id, employee_id, base_salary, currency, effective_date, reason, changed_by, notes, created_at
    FROM compensation_history_2025_01_bad;

    DROP TABLE compensation_history_2025_01_bad;

    UPDATE compensation_month_partitions
    SET range_end = DATE '2025-02-01'
    WHERE month_key = '2025-01';
  END IF;
END $$;
