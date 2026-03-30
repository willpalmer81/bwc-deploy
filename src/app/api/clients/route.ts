import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const clients = await sql`
    SELECT c.*,
      (SELECT count(*)::int FROM sites s WHERE s.client_id = c.id) as site_count,
      (SELECT count(*)::int FROM sites s WHERE s.client_id = c.id AND s.status = 'live') as live_count
    FROM clients c
    ORDER BY c.name
  `;
  return NextResponse.json(clients);
}
