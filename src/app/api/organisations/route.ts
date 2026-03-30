import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const orgs = await sql`
    SELECT o.*,
      cd.arc_org_id, cd.routing_mode, cd.contact_id,
      arc.name as arc_name,
      p.name as contact_name,
      (SELECT count(*)::int FROM sites s WHERE s.org_id = o.id) as site_count,
      (SELECT count(*)::int FROM sites s WHERE s.org_id = o.id AND s.status = 'live') as live_count
    FROM organisations o
    LEFT JOIN org_client_details cd ON cd.org_id = o.id
    LEFT JOIN organisations arc ON cd.arc_org_id = arc.id
    LEFT JOIN people p ON cd.contact_id = p.id
    ORDER BY o.type, o.name
  `;
  return NextResponse.json(orgs);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, type, notes, arc_org_id, routing_mode, contact_id } = body;
  const result = await sql`
    INSERT INTO organisations (name, type, notes)
    VALUES (${name}, ${type || "other"}, ${notes || null})
    RETURNING *
  `;
  const org = result[0];

  // Create client details if type is client
  if (type === "client") {
    await sql`
      INSERT INTO org_client_details (org_id, arc_org_id, routing_mode, contact_id)
      VALUES (${org.id}, ${arc_org_id || null}, ${routing_mode || "TBC"}, ${contact_id || null})
    `;
  }

  return NextResponse.json(org, { status: 201 });
}
