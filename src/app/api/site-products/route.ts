import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const siteId = request.nextUrl.searchParams.get("site_id");

  const whereClause = siteId ? `WHERE sp.site_id = ${parseInt(siteId)}` : "";

  const rows = await sql`
    SELECT sp.id, sp.site_id, sp.product_id, sp.notes,
      p.model_name as product_name, p.type as product_type
    FROM site_products sp
    JOIN products p ON sp.product_id = p.id
    ${siteId ? sql`WHERE sp.site_id = ${parseInt(siteId)}` : sql``}
    ORDER BY sp.site_id, p.model_name
  `;

  // Attach values for each site-product
  if (rows.length > 0) {
    const spIds = rows.map((r) => r.id);
    const values = await sql`
      SELECT spv.site_product_id, spv.property_id, spv.value,
        pp.name, pp.label, pp.unit
      FROM site_product_values spv
      JOIN product_properties pp ON spv.property_id = pp.id
      WHERE spv.site_product_id = ANY(${spIds})
      ORDER BY pp.sort_order
    `;

    const valuesBySpId: Record<number, typeof values> = {};
    for (const v of values) {
      if (!valuesBySpId[v.site_product_id]) valuesBySpId[v.site_product_id] = [];
      valuesBySpId[v.site_product_id].push(v);
    }

    for (const row of rows) {
      (row as Record<string, unknown>).values = valuesBySpId[row.id] ?? [];
    }
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { site_id, product_id, values, notes } = body;

  const result = await sql`
    INSERT INTO site_products (site_id, product_id, notes)
    VALUES (${site_id}, ${product_id}, ${notes || null})
    RETURNING *
  `;
  const spId = result[0].id;

  // Save property values
  if (Array.isArray(values)) {
    for (const v of values) {
      if (v.value && v.value !== "0") {
        await sql`
          INSERT INTO site_product_values (site_product_id, property_id, value)
          VALUES (${spId}, ${v.property_id}, ${String(v.value)})
        `;
      }
    }
  }

  const product = await sql`SELECT model_name as name FROM products WHERE id = ${product_id}`;
  await audit({ action: "create", entity_type: "site_product", entity_id: spId, entity_name: product[0]?.name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
