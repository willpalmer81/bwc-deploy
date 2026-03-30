import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { name, type, notes } = body;
  const result = await sql`
    UPDATE organisations SET name = ${name}, type = ${type || "other"}, notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  await sql`UPDATE people SET org_id = NULL WHERE org_id = ${parseInt(id)}`;
  await sql`DELETE FROM organisations WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}
