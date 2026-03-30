import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { org_id, name, arc_org_id, routing_mode, contact_id, notes } = body;
  const result = await sql`
    UPDATE cohorts SET
      org_id = ${org_id},
      name = ${name},
      arc_org_id = ${arc_org_id || null},
      routing_mode = ${routing_mode || null},
      contact_id = ${contact_id || null},
      notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit({ action: "update", entity_type: "cohort", entity_id: parseInt(id), entity_name: name, changes: body });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const co = await sql`SELECT name FROM cohorts WHERE id = ${parseInt(id)}`;
  await sql`UPDATE sites SET cohort_id = NULL WHERE cohort_id = ${parseInt(id)}`;
  await sql`DELETE FROM cohorts WHERE id = ${parseInt(id)}`;
  await audit({ action: "delete", entity_type: "cohort", entity_id: parseInt(id), entity_name: co[0]?.name });
  return NextResponse.json({ ok: true });
}
