import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const {
    client_id, cohort_id, name, building_name, address, postcode,
    residential_units, communal_units, dmp_group_name, dmp_group_uuid, status, notes,
  } = body;
  const result = await sql`
    UPDATE sites SET
      client_id = ${client_id},
      cohort_id = ${cohort_id || null},
      name = ${name},
      building_name = ${building_name || null},
      address = ${address || null},
      postcode = ${postcode || null},
      residential_units = ${residential_units || null},
      communal_units = ${communal_units || null},
      dmp_group_name = ${dmp_group_name || null},
      dmp_group_uuid = ${dmp_group_uuid || null},
      status = ${status},
      notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  await sql`DELETE FROM sites WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}
