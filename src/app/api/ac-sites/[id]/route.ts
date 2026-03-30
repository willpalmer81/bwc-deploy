import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { name, address, postcode, notes } = body;
  const result = await sql`
    UPDATE ac_sites SET
      name = ${name},
      address = ${address || null},
      postcode = ${postcode || null},
      notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit({ action: "update", entity_type: "ac_site", entity_id: parseInt(id), entity_name: name, changes: body });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const site = await sql`SELECT name FROM ac_sites WHERE id = ${parseInt(id)}`;
  await sql`DELETE FROM ac_sites WHERE id = ${parseInt(id)}`;
  await audit({ action: "delete", entity_type: "ac_site", entity_id: parseInt(id), entity_name: site[0]?.name });
  return NextResponse.json({ ok: true });
}
