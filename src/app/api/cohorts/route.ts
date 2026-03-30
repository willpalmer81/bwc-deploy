import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const cohorts = await sql`
    SELECT co.*, o.name as client_name,
      cd.routing_mode as client_routing_mode,
      ca.name as client_arc_name,
      cp.name as client_contact_name,
      coa.name as arc_name,
      cop.name as contact_name,
      (SELECT count(*)::int FROM sites s WHERE s.cohort_id = co.id) as site_count
    FROM cohorts co
    JOIN organisations o ON co.org_id = o.id
    LEFT JOIN org_client_details cd ON cd.org_id = o.id
    LEFT JOIN organisations ca ON cd.arc_org_id = ca.id
    LEFT JOIN people cp ON cd.contact_id = cp.id
    LEFT JOIN organisations coa ON co.arc_org_id = coa.id
    LEFT JOIN people cop ON co.contact_id = cop.id
    ORDER BY o.name, co.name
  `;
  return NextResponse.json(cohorts);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { org_id, name, arc_org_id, routing_mode, contact_id, notes } = body;
  const result = await sql`
    INSERT INTO cohorts (org_id, name, arc_org_id, routing_mode, contact_id, notes)
    VALUES (${org_id}, ${name}, ${arc_org_id || null}, ${routing_mode || null}, ${contact_id || null}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
