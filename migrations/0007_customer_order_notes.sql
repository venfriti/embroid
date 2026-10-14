CREATE TABLE IF NOT EXISTS notes(
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  order_id TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  removed_at TEXT,
  removed_by TEXT,
  CHECK ((customer_id IS NOT NULL AND order_id IS NULL) OR (customer_id IS NULL AND order_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS notes_customer_idx ON notes(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_order_idx ON notes(order_id, created_at DESC);
CREATE TABLE IF NOT EXISTS note_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id TEXT NOT NULL REFERENCES notes(id),
  action TEXT NOT NULL,
  body TEXT,
  detail TEXT,
  at TEXT NOT NULL,
  by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS note_events_note_idx ON note_events(note_id, id DESC);
CREATE TABLE IF NOT EXISTS note_attachments(
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id),
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  removed_at TEXT,
  removed_by TEXT
);
CREATE INDEX IF NOT EXISTS note_attachments_note_idx ON note_attachments(note_id, created_at);

INSERT INTO notes(id, customer_id, body, created_at, created_by, updated_at, updated_by)
SELECT 'legacy-customer-' || id, id, notes, COALESCE(created, datetime('now')), 'Existing record', COALESCE(created, datetime('now')), 'Existing record'
FROM customers WHERE notes IS NOT NULL AND trim(notes) != ''
ON CONFLICT(id) DO NOTHING;
INSERT INTO note_events(note_id, action, body, at, by)
SELECT id, 'added', body, created_at, created_by FROM notes WHERE id LIKE 'legacy-customer-%';

INSERT INTO notes(id, order_id, body, created_at, created_by, updated_at, updated_by)
SELECT 'legacy-order-' || id, id, note, COALESCE(placed, datetime('now')), 'Existing record', COALESCE(placed, datetime('now')), 'Existing record'
FROM orders WHERE note IS NOT NULL AND trim(note) != ''
ON CONFLICT(id) DO NOTHING;
INSERT INTO note_events(note_id, action, body, at, by)
SELECT id, 'added', body, created_at, created_by FROM notes WHERE id LIKE 'legacy-order-%';
