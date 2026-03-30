import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { client_id, name, status, arc, routing_mode, alertacall_contact, notes } = body;
  const result = await sql`
    UPDATE cohorts SET
      client_id = ${client_id},
      name = ${name},
      status = ${status},
      arc = ${arc || null},
      routing_mode = ${routing_mode || null},
      alertacall_contact = ${alertacall_contact || null},
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
  await sql`UPDATE sites SET cohort_id = NULL WHERE cohort_id = ${parseInt(id)}`;
  await sql`DELETE FROM cohorts WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}
