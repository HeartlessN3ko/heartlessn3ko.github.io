-- Additive migration. Notification addresses never enter public comments.
CREATE TABLE IF NOT EXISTS game_jam_signups (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  handle TEXT NOT NULL DEFAULT '',
  interest TEXT NOT NULL DEFAULT '' CHECK (interest IN ('', 'compete', 'teammates', 'follow')),
  created_at TEXT NOT NULL,
  consent_version TEXT NOT NULL
);
