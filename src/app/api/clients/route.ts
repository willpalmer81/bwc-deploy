import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const clients = await sql`
    SELECT c.*, a.name as arc_name,
      (SELECT count(*)::int FROM sites s WHERE s.client_id = c.id) as site_count,
      (SELECT count(*)::int FROM sites s WHERE s.client_id = c.id AND s.status = 'live') as live_count
    FROM clients c
    LEFT JOIN arcs a ON c.arc_id = a.id
    ORDER BY c.name
  `;
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, arc_id, routing_mode, alertacall_contact, notes } = body;
  const result = await sql`
    INSERT INTO clients (name, arc_id, routing_mode, alertacall_contact, notes)
    VALUES (${name}, ${arc_id || null}, ${routing_mode}, ${alertacall_contact}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
