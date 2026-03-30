import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const siteId = request.nextUrl.searchParams.get("site_id");

  if (siteId) {
    const rows = await sql`
      SELECT sp.*, p.name as product_name, p.category as product_category
      FROM site_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.site_id = ${parseInt(siteId)}
      ORDER BY p.name
    `;
    return NextResponse.json(rows);
  }

  const rows = await sql`
    SELECT sp.*, p.name as product_name, p.category as product_category
    FROM site_products sp
    JOIN products p ON sp.product_id = p.id
    ORDER BY sp.site_id, p.name
  `;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { site_id, product_id, residential_qty, communal_qty, external_qty, notes } = body;
  const result = await sql`
    INSERT INTO site_products (site_id, product_id, residential_qty, communal_qty, external_qty, notes)
    VALUES (${site_id}, ${product_id}, ${residential_qty || 0}, ${communal_qty || 0}, ${external_qty || 0}, ${notes || null})
    RETURNING *
  `;
  const product = await sql`SELECT name FROM products WHERE id = ${product_id}`;
  await audit({ action: "create", entity_type: "site_product", entity_id: result[0].id, entity_name: product[0]?.name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
