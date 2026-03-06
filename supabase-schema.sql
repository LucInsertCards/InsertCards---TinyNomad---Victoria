-- =============================================================
-- TinyNomad Insert Card - Supabase Database Schema
-- =============================================================

-- Customer submissions table
CREATE TABLE IF NOT EXISTS tn_customer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  opt_in_surveys BOOLEAN DEFAULT FALSE,
  review_generated BOOLEAN DEFAULT FALSE,
  review_stars INTEGER CHECK (review_stars >= 1 AND review_stars <= 5),
  review_tone TEXT,
  review_text TEXT,
  went_to_amazon BOOLEAN DEFAULT FALSE,
  claimed_gifts BOOLEAN DEFAULT FALSE,
  product_slug TEXT NOT NULL DEFAULT 'dino'  -- 'dino' or 'unicorn'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tn_customer_email ON tn_customer_submissions(email);
CREATE INDEX IF NOT EXISTS idx_tn_created_at ON tn_customer_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tn_went_to_amazon ON tn_customer_submissions(went_to_amazon);
CREATE INDEX IF NOT EXISTS idx_tn_claimed_gifts ON tn_customer_submissions(claimed_gifts);
CREATE INDEX IF NOT EXISTS idx_tn_product_slug ON tn_customer_submissions(product_slug);

-- Enable Row Level Security
ALTER TABLE tn_customer_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public insert" ON tn_customer_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON tn_customer_submissions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public select" ON tn_customer_submissions
  FOR SELECT USING (true);

-- Gift downloads tracking table
CREATE TABLE IF NOT EXISTS tn_gift_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id UUID REFERENCES tn_customer_submissions(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,  -- 'travel_ebook'
  product_slug TEXT NOT NULL DEFAULT 'dino'
);

-- Enable RLS on gift_downloads
ALTER TABLE tn_gift_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON tn_gift_downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON tn_gift_downloads
  FOR SELECT USING (true);

-- Deleted customer submissions (trash)
CREATE TABLE IF NOT EXISTS tn_deleted_customer_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  opt_in_surveys BOOLEAN,
  review_generated BOOLEAN,
  review_stars INTEGER,
  review_tone TEXT,
  review_text TEXT,
  went_to_amazon BOOLEAN,
  claimed_gifts BOOLEAN,
  product_slug TEXT
);

ALTER TABLE tn_deleted_customer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON tn_deleted_customer_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON tn_deleted_customer_submissions
  FOR SELECT USING (true);

-- Config key-value store (admin settings)
CREATE TABLE IF NOT EXISTS tn_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tn_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON tn_config
  FOR SELECT USING (true);

CREATE POLICY "Allow public upsert" ON tn_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON tn_config
  FOR UPDATE USING (true);

-- Insert default config values
INSERT INTO tn_config (key, value) VALUES
  ('ebook_url', ''),
  ('amazon_review_url_dino', 'https://amazon.com/review/create-review?asin=B0DNKC2SG5'),
  ('amazon_review_url_unicorn', 'https://amazon.com/review/create-review'),
  ('welcome_message', 'Thank you for your purchase!'),
  ('welcome_subtitle', 'We''re so glad your little adventurer is ready to explore the world with their new scooter suitcase!'),
  ('gift_title', 'The Ultimate Family Travel Guide'),
  ('gift_description', 'Tips, hacks, and fun activities to make every family trip unforgettable. From airport survival tips to kid-friendly destinations — everything you need for stress-free travel with your little nomad!')
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE tn_customer_submissions IS 'TinyNomad - Customer submissions for scooter suitcase review funnel';
COMMENT ON COLUMN tn_customer_submissions.product_slug IS 'Product identifier: dino or unicorn';
COMMENT ON TABLE tn_config IS 'TinyNomad - Admin config key-value store';
