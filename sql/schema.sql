-- VWD Comment System - PostgreSQL Schema
-- Run this in Vercel Postgres (Neon) console or via `psql`

-- Comments table
CREATE TABLE IF NOT EXISTS "Comment" (
  id SERIAL PRIMARY KEY,
  created BIGINT NOT NULL,
  post_slug TEXT NOT NULL,
  post_url TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  url TEXT,
  ip_address TEXT,
  os TEXT,
  browser TEXT,
  device TEXT,
  ua TEXT,
  content_text TEXT,
  content_html TEXT,
  parent_id BIGINT,
  status TEXT DEFAULT 'approved',
  priority INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  site_id TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_comment_post_slug ON "Comment"(post_slug);
CREATE INDEX IF NOT EXISTS idx_comment_status ON "Comment"(status);
CREATE INDEX IF NOT EXISTS idx_comment_parent_id ON "Comment"(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_site_id ON "Comment"(site_id);
CREATE INDEX IF NOT EXISTS idx_comment_created ON "Comment"(created DESC);

-- Settings table (key-value)
CREATE TABLE IF NOT EXISTS "Settings" (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Page stats table
CREATE TABLE IF NOT EXISTS "page_stats" (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL DEFAULT '',
  post_slug TEXT NOT NULL,
  post_title TEXT,
  post_url TEXT,
  pv INTEGER NOT NULL DEFAULT 0,
  last_visit_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(site_id, post_slug)
);

CREATE INDEX IF NOT EXISTS idx_page_stats_site_id ON page_stats(site_id);

-- Daily visit stats
CREATE TABLE IF NOT EXISTS "page_visit_daily" (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  domain TEXT,
  count INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  site_id TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_page_visit_daily_site_id ON page_visit_daily(site_id);
CREATE INDEX IF NOT EXISTS idx_page_visit_daily_date ON page_visit_daily(date);

-- Likes table
CREATE TABLE IF NOT EXISTS "Likes" (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL DEFAULT '',
  page_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  UNIQUE(site_id, page_slug, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_site_id ON "Likes"(site_id);
CREATE INDEX IF NOT EXISTS idx_likes_page_slug ON "Likes"(page_slug);
