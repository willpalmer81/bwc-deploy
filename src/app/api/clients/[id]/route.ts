import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { name, arc, routing_mode, alertacall_contact, notes } = body;
  const result = await sql`
    UPDATE clients SET
      name = ${name},
      arc = ${arc},
      routing_mode = ${routing_mode},
      alertacall_contact = ${alertacall_contact},
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
  await sql`DELETE FROM sites WHERE client_id = ${parseInt(id)}`;
  await sql`DELETE FROM cohorts WHERE client_id = ${parseInt(id)}`;
  await sql`DELETE FROM clients WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}
