import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const { searchParams } = request.nextUrl;
  const orgId = searchParams.get("org_id");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const allSites = await sql`
    SELECT s.*, o.name as client_name, co.name as cohort_name,
      COALESCE(coa.name, ca.name) as effective_arc,
      COALESCE(co.routing_mode, cd.routing_mode) as effective_routing_mode,
      COALESCE(cop.name, cp.name) as effective_contact
    FROM sites s
    JOIN organisations o ON s.org_id = o.id
    LEFT JOIN org_client_details cd ON cd.org_id = o.id
    LEFT JOIN cohorts co ON s.cohort_id = co.id
    LEFT JOIN organisations ca ON cd.arc_org_id = ca.id
    LEFT JOIN organisations coa ON co.arc_org_id = coa.id
    LEFT JOIN people cp ON cd.contact_id = cp.id
    LEFT JOIN people cop ON co.contact_id = cop.id
    ORDER BY o.name, co.name NULLS FIRST, s.name
  `;

  const filtered = allSites.filter((site) => {
    if (orgId && site.org_id !== parseInt(orgId)) return false;
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
    org_id, cohort_id, name, building_name, address, postcode,
    dmp_group_name, dmp_group_uuid, status, notes,
  } = body;
  const result = await sql`
    INSERT INTO sites (org_id, cohort_id, name, building_name, address, postcode,
      dmp_group_name, dmp_group_uuid, status, notes)
    VALUES (${org_id}, ${cohort_id || null}, ${name}, ${building_name || null},
      ${address || null}, ${postcode || null},
      ${dmp_group_name || null}, ${dmp_group_uuid || null},
      ${status}, ${notes || null})
    RETURNING *
  `;
  await audit({ action: "create", entity_type: "site", entity_id: result[0].id, entity_name: name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
