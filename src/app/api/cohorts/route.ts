import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const cohorts = await sql`
    SELECT co.*, c.name as client_name,
      ca.name as client_arc_name, c.routing_mode as client_routing_mode,
      cp.name as client_contact_name,
      coa.name as arc_name,
      cop.name as contact_name,
      (SELECT count(*)::int FROM sites s WHERE s.cohort_id = co.id) as site_count
    FROM cohorts co
    JOIN clients c ON co.client_id = c.id
    LEFT JOIN arcs ca ON c.arc_id = ca.id
    LEFT JOIN people cp ON c.contact_id = cp.id
    LEFT JOIN arcs coa ON co.arc_id = coa.id
    LEFT JOIN people cop ON co.contact_id = cop.id
    ORDER BY c.name, co.name
  `;
  return NextResponse.json(cohorts);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { client_id, name, arc_id, routing_mode, contact_id, notes } = body;
  const result = await sql`
    INSERT INTO cohorts (client_id, name, arc_id, routing_mode, contact_id, notes)
    VALUES (${client_id}, ${name}, ${arc_id || null}, ${routing_mode || null}, ${contact_id || null}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
