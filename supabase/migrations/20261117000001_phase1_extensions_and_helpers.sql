-- Phase 1: Extensions and Shared Database Trigger Helpers
-- Strictly non-destructive and repeatable across nido-dev and nido-prod.

-- 1. Required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Shared updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Standard Phase 1 trigger helper to maintain updated_at timestamps on row updates.';
