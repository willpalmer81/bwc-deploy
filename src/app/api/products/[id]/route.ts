import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = parseInt(id);
  const sql = getDb();
  const body = await request.json();
  const { model_name, type, manufacturer_org_id, notes, properties } = body;

  const result = await sql`
    UPDATE products SET
      model_name = ${model_name}, type = ${type || null},
      manufacturer_org_id = ${manufacturer_org_id || null},
      notes = ${notes || null}
    WHERE id = ${productId}
    RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update properties if provided: delete old ones not in use, upsert new ones
  if (Array.isArray(properties)) {
    // Get existing properties
    const existing = await sql`SELECT id FROM product_properties WHERE product_id = ${productId}`;
    const existingIds = new Set(existing.map((e) => e.id));

    // Check which properties are in use (have values)
    const inUse = await sql`
      SELECT DISTINCT pp.id
      FROM product_properties pp
      JOIN site_product_values spv ON spv.property_id = pp.id
      WHERE pp.product_id = ${productId}
    `;
    const inUseIds = new Set(inUse.map((e) => e.id));

    // Delete existing properties that are NOT in use
    // (properties with values are kept to avoid data loss)
    for (const eid of existingIds) {
      if (!inUseIds.has(eid)) {
        await sql`DELETE FROM product_properties WHERE id = ${eid}`;
      }
    }

    // Insert new properties
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      if (prop.label?.trim()) {
        await sql`
          INSERT INTO product_properties (product_id, name, label, unit, sort_order)
          VALUES (${productId}, ${prop.name}, ${prop.label}, ${prop.unit || null}, ${i})
        `;
      }
    }
  }

  await audit({ action: "update", entity_type: "product", entity_id: productId, entity_name: model_name, changes: body });
  return NextResponse.json(result[0]);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const sql = getDb();
  const product = await sql`SELECT model_name FROM products WHERE id = ${parseInt(id)}`;
  await sql`DELETE FROM site_products WHERE product_id = ${parseInt(id)}`;
  await sql`DELETE FROM products WHERE id = ${parseInt(id)}`;
  await audit({ action: "delete", entity_type: "product", entity_id: parseInt(id), entity_name: product[0]?.model_name });
  return NextResponse.json({ ok: true });
}
