import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { name, email, phone, role, notes } = body;
  const result = await sql`
    UPDATE people SET
      name = ${name}, email = ${email || null}, phone = ${phone || null},
      role = ${role || null}, notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  await sql`UPDATE clients SET contact_id = NULL WHERE contact_id = ${parseInt(id)}`;
  await sql`UPDATE cohorts SET contact_id = NULL WHERE contact_id = ${parseInt(id)}`;
  await sql`DELETE FROM people WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}
