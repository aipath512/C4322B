-- Migration for databases created with the earlier admin schema.
-- Run ONLY if the database already contains admin_records without these columns.
ALTER TABLE admin_records ADD COLUMN country TEXT NOT NULL DEFAULT 'RO';
ALTER TABLE admin_records ADD COLUMN latitude REAL;
ALTER TABLE admin_records ADD COLUMN longitude REAL;
CREATE INDEX IF NOT EXISTS idx_admin_records_country ON admin_records(country);
-- Records without coordinates are deliberately excluded from geographic filtered results.
