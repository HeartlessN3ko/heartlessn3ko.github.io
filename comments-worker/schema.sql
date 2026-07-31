CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_slug TEXT NOT NULL,
  parent_id TEXT REFERENCES comments(id),
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved', 'hidden', 'spam')),
  is_author INTEGER NOT NULL DEFAULT 0 CHECK (is_author IN (0, 1)),
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  moderated_at TEXT
);

CREATE INDEX IF NOT EXISTS comments_article_status_created
  ON comments(article_slug, status, created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  fingerprint TEXT NOT NULL,
  action TEXT NOT NULL,
  bucket TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (fingerprint, action, bucket)
);

CREATE TABLE IF NOT EXISTS reports (
  comment_id TEXT NOT NULL REFERENCES comments(id),
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (comment_id, fingerprint)
);
