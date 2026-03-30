import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const products = await sql`
    SELECT p.*, o.name as manufacturer_name
    FROM products p
    LEFT JOIN organisations o ON p.manufacturer_org_id = o.id
    ORDER BY p.model_name
  `;

  // Attach properties to each product
  const properties = await sql`
    SELECT * FROM product_properties ORDER BY product_id, sort_order
  `;

  const propsByProduct: Record<number, typeof properties> = {};
  for (const prop of properties) {
    if (!propsByProduct[prop.product_id]) propsByProduct[prop.product_id] = [];
    propsByProduct[prop.product_id].push(prop);
  }

  const result = products.map((p) => ({
    ...p,
    properties: propsByProduct[p.id] ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { model_name, type, manufacturer_org_id, notes, properties } = body;
  const result = await sql`
    INSERT INTO products (model_name, type, manufacturer_org_id, notes)
    VALUES (${model_name}, ${type || null}, ${manufacturer_org_id || null}, ${notes || null})
    RETURNING *
  `;
  const productId = result[0].id;

  // Create properties if provided
  if (Array.isArray(properties) && properties.length > 0) {
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      await sql`
        INSERT INTO product_properties (product_id, name, label, unit, sort_order)
        VALUES (${productId}, ${prop.name}, ${prop.label}, ${prop.unit || null}, ${i})
      `;
    }
  }

  await audit({ action: "create", entity_type: "product", entity_id: productId, entity_name: model_name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
