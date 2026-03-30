import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const body = await request.json();
  const { product_id, residential_qty, communal_qty, external_qty, notes } = body;
  const result = await sql`
    UPDATE site_products SET
      product_id = ${product_id},
      residential_qty = ${residential_qty || 0},
      communal_qty = ${communal_qty || 0},
      external_qty = ${external_qty || 0},
      notes = ${notes || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const product = await sql`SELECT name FROM products WHERE id = ${product_id}`;
  await audit({ action: "update", entity_type: "site_product", entity_id: parseInt(id), entity_name: product[0]?.name, changes: body });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const sp = await sql`SELECT sp.id, p.name FROM site_products sp JOIN products p ON sp.product_id = p.id WHERE sp.id = ${parseInt(id)}`;
  await sql`DELETE FROM site_products WHERE id = ${parseInt(id)}`;
  await audit({ action: "delete", entity_type: "site_product", entity_id: parseInt(id), entity_name: sp[0]?.name });
  return NextResponse.json({ ok: true });
}
