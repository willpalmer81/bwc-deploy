import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { name, type, notes, arc_org_id, routing_mode, contact_id } = body;

  const result = await sql`
    UPDATE organisations SET name = ${name}, type = ${type || "other"}, notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (type === "client") {
    const exists = await sql`SELECT id FROM org_client_details WHERE org_id = ${parseInt(id)}`;
    if (exists.length > 0) {
      await sql`
        UPDATE org_client_details SET
          arc_org_id = ${arc_org_id || null},
          routing_mode = ${routing_mode || "TBC"},
          contact_id = ${contact_id || null}
        WHERE org_id = ${parseInt(id)}
      `;
    } else {
      await sql`
        INSERT INTO org_client_details (org_id, arc_org_id, routing_mode, contact_id)
        VALUES (${parseInt(id)}, ${arc_org_id || null}, ${routing_mode || "TBC"}, ${contact_id || null})
      `;
    }
  } else {
    await sql`DELETE FROM org_client_details WHERE org_id = ${parseInt(id)}`;
  }

  await audit({ action: "update", entity_type: "organisation", entity_id: parseInt(id), entity_name: name, changes: body });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const org = await sql`SELECT name FROM organisations WHERE id = ${parseInt(id)}`;
  await sql`DELETE FROM sites WHERE org_id = ${parseInt(id)}`;
  await sql`DELETE FROM cohorts WHERE org_id = ${parseInt(id)}`;
  await sql`UPDATE people SET org_id = NULL WHERE org_id = ${parseInt(id)}`;
  await sql`DELETE FROM org_client_details WHERE org_id = ${parseInt(id)}`;
  await sql`DELETE FROM organisations WHERE id = ${parseInt(id)}`;
  await audit({ action: "delete", entity_type: "organisation", entity_id: parseInt(id), entity_name: org[0]?.name });
  return NextResponse.json({ ok: true });
}
