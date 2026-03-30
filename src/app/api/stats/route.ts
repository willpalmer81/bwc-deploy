import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();

  const [clients, sites, statusCounts] = await Promise.all([
    sql`SELECT count(*)::int as count FROM clients`,
    sql`SELECT count(*)::int as count FROM sites`,
    sql`SELECT status, count(*)::int as count FROM sites GROUP BY status ORDER BY status`,
  ]);

  return NextResponse.json({
    totalClients: clients[0].count,
    totalSites: sites[0].count,
    byStatus: statusCounts,
  });
}
