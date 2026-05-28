/**
 * GET /api/collection/stats
 *
 * Returns the market value of the authenticated user's collection
 * for each of the last 12 calendar months — formatted for Recharts.
 *
 * Response shape:
 *   [
 *     { "fecha": "Jun 2025", "valorTotal": 0 },
 *     ...
 *     { "fecha": "May 2026", "valorTotal": 1340.75 }
 *   ]
 *
 * The heavy lifting (generating months, joining prices, summing) is done
 * by the `get_collection_value_history` PostgreSQL function registered in
 * schema_stats_fn.sql — a single DB round-trip for the entire 12-month series.
 */

import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Route segment config ──────────────────────────────────────────────────────
// Never cache this route — value changes whenever the cron job runs.
export const dynamic = 'force-dynamic';

// ─── Month formatter ───────────────────────────────────────────────────────────
// Produces "jun 2025" → capitalised to "Jun 2025".
// Using UTC so the date string from Postgres ("2025-06-01") isn't shifted by
// the server's local timezone.
const MONTH_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatMonth(isoDate: string): string {
  // Append time so the Date constructor treats it as UTC, not local time.
  const d = new Date(`${isoDate}T00:00:00Z`);
  const raw = MONTH_FORMATTER.format(d); // "jun 2025" | "may 2026"
  return raw.charAt(0).toUpperCase() + raw.slice(1); // "Jun 2025"
}

// ─── RPC row type returned by Supabase ────────────────────────────────────────
interface ValueHistoryRow {
  month_start: string;   // "YYYY-MM-DD"
  valor_total: number;   // already NUMERIC(10,2) from Postgres
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest): Promise<Response> {
  // 1. Validate session — the server client reads cookies automatically.
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: 'No autenticado. Inicia sesión para ver tus estadísticas.' },
      { status: 401 },
    );
  }

  // 2. Call the PostgreSQL RPC — one DB round-trip for the full 12-month series.
  const { data, error } = await supabase.rpc('get_collection_value_history', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('[stats] RPC get_collection_value_history failed:', error);
    return Response.json(
      { error: 'Error al calcular el historial de valor de la colección.' },
      { status: 500 },
    );
  }

  // 3. Transform DB rows → Recharts-ready format.
  const chartData = (data as ValueHistoryRow[]).map((row) => ({
    fecha: formatMonth(row.month_start),
    valorTotal: Number(row.valor_total), // cast from Postgres numeric string
  }));

  // 4. Return with explicit cache headers so browsers / CDN don't cache stale data.
  return Response.json(chartData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
