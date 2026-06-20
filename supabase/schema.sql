-- ============================================================
-- items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  count       INTEGER     NOT NULL DEFAULT 1 CHECK (count > 0),
  priority    TEXT        NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low', 'normal', 'high')),
  checked     BOOLEAN     NOT NULL DEFAULT false,
  label       TEXT,
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
-- Row Level Security — fully open (anon read/write)
-- ============================================================
ALTER TABLE public.items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_items"   ON public.items   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all_recipes" ON public.recipes FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Realtime — items only
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
