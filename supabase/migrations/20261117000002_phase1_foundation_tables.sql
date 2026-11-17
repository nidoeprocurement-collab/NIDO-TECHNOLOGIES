-- Phase 1: Initial Database Foundation
-- Tables: document_sequences, platform_settings, migration_batches
-- Security Note: RLS policies referencing nido_users / client_users will be attached
-- in Phase 2 and Phase 4 once identity and RBAC helper functions are created.

-- ============================================================================
-- 1. document_sequences
-- Centralized, concurrency-safe business document numbering.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_key text NOT NULL UNIQUE,
  prefix text NOT NULL,
  next_value bigint NOT NULL DEFAULT 1 CHECK (next_value >= 1),
  pad_length integer NOT NULL DEFAULT 5 CHECK (pad_length BETWEEN 1 AND 12),
  include_year boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_document_sequences_updated_at ON public.document_sequences;
CREATE TRIGGER trg_document_sequences_updated_at
  BEFORE UPDATE ON public.document_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.document_sequences IS
  'Centralized sequence counters for NIDO business identifiers (CL-, ORD-, PO-, MPC-, CPC-, VPC-, INV-, SVC-, LIC-, etc.).';

-- Seed default sequence keys idempotently (never overwrites existing next_value).
INSERT INTO public.document_sequences (seq_key, prefix, next_value, pad_length, include_year, description)
VALUES
  ('CL',      'CL-',        1, 5, false, 'Client organization business code'),
  ('ORD',     'ORD-',       1, 6, false, 'Customer order number'),
  ('PO',      'PO-',        9, 5, false, 'Purchase order number (starts after legacy PO-00008)'),
  ('MPC',     'MPC-',       1, 6, true,  'Master product code (MPC-YYYY-NNNNNN)'),
  ('CPC',     'CPC-',       1, 5, false, 'Client catalog product code'),
  ('VPC',     'VPC-',       1, 5, false, 'Vendor product code'),
  ('INV',     'INV-',       1, 5, true,  'Sales invoice number'),
  ('PRO_INV', 'PRO INV - ', 1, 6, true,  'Proforma invoice number'),
  ('SO',      'SO-',        1, 6, false, 'Sales order number'),
  ('QT',      'QT-',        1, 6, false, 'Sales quote number'),
  ('PMT',     'PMT-',       1, 6, false, 'Payment receipt number'),
  ('SVC',     'SVC-',       1, 5, true,  'Service request number (SVC-YYYY-NNNNN)'),
  ('LIC',     'LIC-',       1, 3, false, 'Digital licence reference suffix'),
  ('DC',      'DC-',        1, 5, true,  'Delivery challan number')
ON CONFLICT (seq_key) DO NOTHING;

-- Atomic sequence allocation RPC (concurrency-safe via row-level UPDATE lock).
CREATE OR REPLACE FUNCTION public.allocate_document_number(
  p_seq_key text,
  p_custom_prefix text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allocated bigint;
  v_prefix text;
  v_pad integer;
  v_include_year boolean;
  v_year text;
BEGIN
  UPDATE public.document_sequences
  SET next_value = next_value + 1
  WHERE seq_key = p_seq_key
  RETURNING next_value - 1, prefix, pad_length, include_year
  INTO v_allocated, v_prefix, v_pad, v_include_year;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown document sequence key: %', p_seq_key
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_custom_prefix IS NOT NULL AND btrim(p_custom_prefix) <> '' THEN
    v_prefix := p_custom_prefix;
  END IF;

  IF v_include_year THEN
    v_year := to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-';
    RETURN v_prefix || v_year || lpad(v_allocated::text, v_pad, '0');
  END IF;

  RETURN v_prefix || lpad(v_allocated::text, v_pad, '0');
END;
$$;

COMMENT ON FUNCTION public.allocate_document_number(text, text) IS
  'Atomically allocates and formats the next business document number for a given seq_key without race-condition duplicates.';

-- ============================================================================
-- 2. platform_settings
-- Platform-wide configuration store (not client-specific).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  category text NOT NULL CHECK (
    category IN (
      'general',
      'organization',
      'localization',
      'procurement',
      'notifications',
      'security',
      'prefixes',
      'sla',
      'transaction',
      'other'
    )
  ),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_category
  ON public.platform_settings (category);

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.platform_settings IS
  'Platform-wide configuration settings stored as JSONB. Client-specific settings belong in client_general_settings (Phase 4).';

-- ============================================================================
-- 3. migration_batches
-- Audit and tracking table for future browser-localStorage data migration.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.migration_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text NOT NULL UNIQUE,
  source_environment text NOT NULL,
  source_label text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'dry_run' CHECK (mode IN ('dry_run', 'commit', 'rolled_back')),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'completed_with_errors', 'failed')
  ),
  started_at timestamptz,
  completed_at timestamptz,
  total_records integer NOT NULL DEFAULT 0 CHECK (total_records >= 0),
  imported_records integer NOT NULL DEFAULT 0 CHECK (imported_records >= 0),
  skipped_records integer NOT NULL DEFAULT 0 CHECK (skipped_records >= 0),
  failed_records integer NOT NULL DEFAULT 0 CHECK (failed_records >= 0),
  error_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_migration_batches_status_created
  ON public.migration_batches (status, created_at DESC);

DROP TRIGGER IF EXISTS trg_migration_batches_updated_at ON public.migration_batches;
CREATE TRIGGER trg_migration_batches_updated_at
  BEFORE UPDATE ON public.migration_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.migration_batches IS
  'Tracks dry-run, commit, and rollback runs for migrating existing browser localStorage data into Supabase PostgreSQL.';
