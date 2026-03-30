import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const cohorts = await sql`
    SELECT co.*, c.name as client_name,
      c.arc as client_arc, c.routing_mode as client_routing_mode, c.alertacall_contact as client_alertacall_contact,
      (SELECT count(*)::int FROM sites s WHERE s.cohort_id = co.id) as site_count
    FROM cohorts co
    JOIN clients c ON co.client_id = c.id
    ORDER BY c.name, co.name
  `;
  return NextResponse.json(cohorts);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { client_id, name, status, arc, routing_mode, alertacall_contact, notes } = body;
  const result = await sql`
    INSERT INTO cohorts (client_id, name, status, arc, routing_mode, alertacall_contact, notes)
    VALUES (${client_id}, ${name}, ${status}, ${arc || null}, ${routing_mode || null}, ${alertacall_contact || null}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
