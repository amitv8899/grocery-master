-- ============================================================
-- items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  count       NUMERIC     NOT NULL DEFAULT 1 CHECK (count > 0),
  unit        TEXT        NOT NULL DEFAULT 'count'
                          CHECK (unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz')),
  priority    TEXT        NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low', 'normal', 'high')),
  checked     BOOLEAN     NOT NULL DEFAULT false,
  label       TEXT,
  from_recipe BOOLEAN     NOT NULL DEFAULT false,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Required for realtime UPDATE/DELETE to include full row data in payload
ALTER TABLE public.items REPLICA IDENTITY FULL;

-- ============================================================
-- recipes
-- ============================================================
-- ingredients JSONB shape: Array<{ name: string; count: number; priority: 'low'|'normal'|'high'; label: string | null }>
CREATE TABLE IF NOT EXISTS public.recipes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  ingredients JSONB       NOT NULL DEFAULT '[]'::jsonb,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- item_catalog — remembers last tag used per item name
-- ============================================================
CREATE TABLE IF NOT EXISTS public.item_catalog (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  tag_name   TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security — fully open (anon read/write)
-- ============================================================
ALTER TABLE public.items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_items"    ON public.items        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all_recipes"  ON public.recipes      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all_catalog"  ON public.item_catalog FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Realtime — items only
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;

-- ============================================================
-- Migration: add `unit` support (safe to re-run on an already
-- deployed database — the CREATE TABLE above only affects fresh installs)
-- ============================================================
ALTER TABLE public.items ALTER COLUMN count TYPE NUMERIC USING count::numeric;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'count';

DO $$
BEGIN
  ALTER TABLE public.items
    ADD CONSTRAINT items_unit_check CHECK (unit IN ('count', 'g', 'kg', 'ml', 'l', 'oz'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Migration: track items created from a recipe, so checking them
-- as bought deletes them outright instead of moving them to the
-- Bought section (safe to re-run on an already deployed database)
-- ============================================================
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS from_recipe BOOLEAN NOT NULL DEFAULT false;
