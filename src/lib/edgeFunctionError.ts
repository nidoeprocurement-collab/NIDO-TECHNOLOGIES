import { supabase } from '@/lib/supabase';

export async function extractEdgeError(
  error: unknown,
  data: unknown,
  fallback: string,
): Promise<string> {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as { error?: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }
  if (error && typeof error === 'object') {
    const context = (
      error as {
        context?: { json?: () => Promise<unknown>; text?: () => Promise<string> };
      }
    ).context;
    if (context?.json) {
      try {
        const parsed = await context.json();
        if (
          parsed &&
          typeof parsed === 'object' &&
          'error' in parsed &&
          typeof (parsed as { error?: unknown }).error === 'string'
        ) {
          return (parsed as { error: string }).error;
        }
      } catch {
        // ignore JSON parse failure
      }
    }
    if (context?.text) {
      try {
        const txt = await context.text();
        if (txt) return txt;
      } catch {
        // ignore text failure
      }
    }
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return fallback;
}

export async function invokeSupabaseEdgeFunction<T = Record<string, unknown>>(
  functionName: string,
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<T> {
  const invokeFn = (supabase as unknown as { functions?: { invoke?: unknown } }).functions?.invoke;
  if (typeof invokeFn !== 'function') {
    throw new Error('Supabase Edge Function client is unavailable.');
  }

  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error || !(data as { success?: boolean } | null)?.success) {
    const msg = await extractEdgeError(error, data, fallbackError);
    throw new Error(msg);
  }
  return data as T;
}

