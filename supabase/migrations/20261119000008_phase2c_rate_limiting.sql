-- NIDO Phase 2C Stage 2 - Database-backed Rate Limiting
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- Adds a service-role-only rate limit bucket table and an atomic,
-- concurrency-safe rate-limit RPC for privileged Edge Functions.

BEGIN;

CREATE TABLE IF NOT EXISTS public.nido_provisioning_rate_limits (
  scope_key text NOT NULL CHECK (btrim(scope_key) <> ''),
  actor_key text NOT NULL CHECK (btrim(actor_key) <> ''),
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope_key, actor_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_nido_provisioning_rate_limits_window
  ON public.nido_provisioning_rate_limits (window_start DESC);

ALTER TABLE public.nido_provisioning_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_provisioning_rate_limits FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nido_provisioning_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.nido_provisioning_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_nido_rate_limit(
  p_scope_key text,
  p_actor_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now timestamptz := now();
  v_scope text := btrim(p_scope_key);
  v_actor text := btrim(p_actor_key);
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_count integer;
  v_allowed boolean;
  v_remaining integer;
  v_retry_after integer;
BEGIN
  IF NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'Trusted backend required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_scope IS NULL OR v_scope = '' OR length(v_scope) > 100 THEN
    RAISE EXCEPTION 'Invalid rate-limit scope' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_actor IS NULL OR v_actor = '' OR length(v_actor) > 200 THEN
    RAISE EXCEPTION 'Invalid rate-limit actor' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_max_requests IS NULL OR p_max_requests < 1 OR p_max_requests > 10000 THEN
    RAISE EXCEPTION 'Invalid rate-limit max requests' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit window' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.date_part('epoch', v_now) / p_window_seconds) * p_window_seconds
  );
  v_window_end := v_window_start + pg_catalog.make_interval(secs => p_window_seconds);

  INSERT INTO public.nido_provisioning_rate_limits (
    scope_key, actor_key, window_start, request_count, created_at, updated_at
  )
  VALUES (
    v_scope, v_actor, v_window_start, 1, v_now, v_now
  )
  ON CONFLICT (scope_key, actor_key, window_start)
  DO UPDATE SET
    request_count = public.nido_provisioning_rate_limits.request_count + 1,
    updated_at = v_now
  RETURNING request_count INTO v_count;

  v_allowed := (v_count <= p_max_requests);
  v_remaining := GREATEST(0, p_max_requests - v_count);
  v_retry_after := CASE
    WHEN v_allowed THEN 0
    ELSE GREATEST(1, pg_catalog.ceil(pg_catalog.date_part('epoch', v_window_end - v_now))::integer)
  END;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining_requests', v_remaining,
    'retry_after_seconds', v_retry_after
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_nido_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_nido_rate_limit(text, text, integer, integer)
  TO service_role;

COMMIT;
