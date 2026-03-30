import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const { searchParams } = request.nextUrl;
  const clientId = searchParams.get("client_id");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  // Fetch all with resolved config (cohort overrides client), filter in JS since dataset is small
  const allSites = await sql`
    SELECT s.*, c.name as client_name, co.name as cohort_name,
      COALESCE(co.arc, c.arc) as effective_arc,
      COALESCE(co.routing_mode, c.routing_mode) as effective_routing_mode,
      COALESCE(co.alertacall_contact, c.alertacall_contact) as effective_contact
    FROM sites s
    JOIN clients c ON s.client_id = c.id
    LEFT JOIN cohorts co ON s.cohort_id = co.id
    ORDER BY c.name, co.name NULLS FIRST, s.name
  `;

  const filtered = allSites.filter((site) => {
    if (clientId && site.client_id !== parseInt(clientId)) return false;
    if (status && site.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        site.name?.toLowerCase().includes(q) ||
        site.building_name?.toLowerCase().includes(q) ||
        site.postcode?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const {
    client_id, cohort_id, name, building_name, address, postcode,
    residential_units, communal_units, dmp_group_name, dmp_group_uuid, status, notes,
  } = body;
  const result = await sql`
    INSERT INTO sites (client_id, cohort_id, name, building_name, address, postcode,
      residential_units, communal_units, dmp_group_name, dmp_group_uuid, status, notes)
    VALUES (${client_id}, ${cohort_id || null}, ${name}, ${building_name || null},
      ${address || null}, ${postcode || null}, ${residential_units || null},
      ${communal_units || null}, ${dmp_group_name || null}, ${dmp_group_uuid || null},
      ${status}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
