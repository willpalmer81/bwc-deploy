import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { name, email, phone, role, org_id, notes } = body;
  const result = await sql`
    UPDATE people SET
      name = ${name}, email = ${email || null}, phone = ${phone || null},
      role = ${role || null}, org_id = ${org_id || null}, notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit({ action: "update", entity_type: "person", entity_id: parseInt(id), entity_name: name, changes: body });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const person = await sql`SELECT name FROM people WHERE id = ${parseInt(id)}`;
  await sql`UPDATE org_client_details SET contact_id = NULL WHERE contact_id = ${parseInt(id)}`;
  await sql`UPDATE cohorts SET contact_id = NULL WHERE contact_id = ${parseInt(id)}`;
  await sql`DELETE FROM people WHERE id = ${parseInt(id)}`;
  await audit({ action: "delete", entity_type: "person", entity_id: parseInt(id), entity_name: person[0]?.name });
  return NextResponse.json({ ok: true });
}
