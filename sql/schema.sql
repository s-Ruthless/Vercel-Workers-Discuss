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
  site_id TEXT DEFAULT 'blog'
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

-- Likes table
CREATE TABLE IF NOT EXISTS "Likes" (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL DEFAULT 'blog',
  page_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  UNIQUE(site_id, page_slug, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_site_id ON "Likes"(site_id);
CREATE INDEX IF NOT EXISTS idx_likes_page_slug ON "Likes"(page_slug);

-- Say (Moments) table
CREATE TABLE IF NOT EXISTS "Say" (
  id SERIAL PRIMARY KEY,
  created BIGINT NOT NULL,
  content_text TEXT NOT NULL,
  content_html TEXT NOT NULL,
  status TEXT DEFAULT 'published',
  likes INTEGER DEFAULT 0,
  tags TEXT,
  site_id TEXT DEFAULT 'blog'
);

CREATE INDEX IF NOT EXISTS idx_say_created ON "Say"(created DESC);
CREATE INDEX IF NOT EXISTS idx_say_status ON "Say"(status);
CREATE INDEX IF NOT EXISTS idx_say_site_id ON "Say"(site_id);
