-- Phase 1 Security Hardening Migration
-- Addresses: CRITICAL-01, CRITICAL-02, HIGH-01, MEDIUM-01, MEDIUM-02
-- Preserves all existing migrations (000001, 000002) and existing sequence counters.

-- ============================================================================
-- 1. CRITICAL-01: Enable RLS (default-deny) & revoke direct table privileges
--    from browser-facing roles (PUBLIC, anon, authenticated).
--    Trusted administration (postgres, supabase_admin, service_role) bypasses RLS.
-- ============================================================================
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_batches ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.document_sequences FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.platform_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.migration_batches FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 2. HIGH-01: Harden public.set_updated_at() with an immutable search_path
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. MEDIUM-02: Preserve exact NIDO year formatting conventions
--    INV -> INV-202600001 (no hyphen after year)
--    PRO_INV -> PRO INV - 2026000001 (no hyphen after year)
--    MPC, SVC, DC -> keep '-' after year (e.g. MPC-2026-000001)
-- ============================================================================
ALTER TABLE public.document_sequences
  ADD COLUMN IF NOT EXISTS year_separator text NOT NULL DEFAULT '-';

UPDATE public.document_sequences
SET year_separator = ''
WHERE seq_key IN ('INV', 'PRO_INV')
  AND year_separator <> '';

-- ============================================================================
-- 4. CRITICAL-02, HIGH-01, MEDIUM-01: Harden allocate_document_number()
--    - Fixed safe search_path (pg_catalog, public)
--    - Atomic row-locked number allocation
--    - Reject invalid custom prefixes & cross-sequence prefix collisions
--    - Revoke EXECUTE from PUBLIC, anon, authenticated; grant to service_role only
-- ============================================================================
CREATE OR REPLACE FUNCTION public.allocate_document_number(
  p_seq_key text,
  p_custom_prefix text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_allocated bigint;
  v_prefix text;
  v_pad integer;
  v_include_year boolean;
  v_year_sep text;
  v_year text;
  v_clean_custom text;
BEGIN
  IF p_seq_key IS NULL OR btrim(p_seq_key) = '' THEN
    RAISE EXCEPTION 'Document sequence key is required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_custom_prefix IS NOT NULL THEN
    v_clean_custom := btrim(p_custom_prefix);
    IF v_clean_custom = '' THEN
      v_clean_custom := NULL;
    ELSE
      IF p_custom_prefix ~ '[[:cntrl:]]' OR length(v_clean_custom) > 24 THEN
        RAISE EXCEPTION 'Invalid custom document prefix'
          USING ERRCODE = 'invalid_parameter_value';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public.document_sequences
        WHERE seq_key <> p_seq_key
          AND btrim(prefix) = v_clean_custom
      ) THEN
        RAISE EXCEPTION 'Custom prefix "%" conflicts with another document sequence', v_clean_custom
          USING ERRCODE = 'unique_violation';
      END IF;
    END IF;
  END IF;

  UPDATE public.document_sequences
  SET next_value = next_value + 1
  WHERE seq_key = p_seq_key
  RETURNING next_value - 1, prefix, pad_length, include_year, year_separator
  INTO v_allocated, v_prefix, v_pad, v_include_year, v_year_sep;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown document sequence key: %', p_seq_key
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_clean_custom IS NOT NULL THEN
    v_prefix := p_custom_prefix;
  END IF;

  IF v_include_year THEN
    v_year := to_char(now() AT TIME ZONE 'UTC', 'YYYY') || v_year_sep;
    RETURN v_prefix || v_year || lpad(v_allocated::text, v_pad, '0');
  END IF;

  RETURN v_prefix || lpad(v_allocated::text, v_pad, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_document_number(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_document_number(text, text) TO service_role;

COMMENT ON FUNCTION public.allocate_document_number(text, text) IS
  'Hardened atomic sequence allocator (service_role only). Preserves NIDO prefix/year conventions and blocks cross-prefix collisions.';
