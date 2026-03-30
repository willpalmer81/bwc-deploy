import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const sites = await sql`SELECT * FROM ac_sites ORDER BY name`;
  return NextResponse.json(sites);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, address, postcode, notes } = body;
  const result = await sql`
    INSERT INTO ac_sites (name, address, postcode, notes)
    VALUES (${name}, ${address || null}, ${postcode || null}, ${notes || null})
    RETURNING *
  `;
  await audit({ action: "create", entity_type: "ac_site", entity_id: result[0].id, entity_name: name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
