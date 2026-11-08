-- TSC INSTAL / C4322B — repository privat de Market Intelligence
-- Rulați doar în baza D1 ADMIN_DB după activarea Cloudflare Access.
CREATE TABLE IF NOT EXISTS admin_records (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('concurenti','parteneri','clienti')),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'RO',
  latitude REAL,
  longitude REAL,
  website TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'nou' CHECK (status IN ('nou','analiza','contactat','oportunitate','inactiv')),
  services TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_records_category_updated ON admin_records(category, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_records_country ON admin_records(country);
CREATE INDEX IF NOT EXISTS idx_admin_records_status ON admin_records(status);
