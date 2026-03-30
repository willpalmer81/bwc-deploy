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
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { model_name, description, category, manufacturer_org_id, notes } = body;
  const result = await sql`
    INSERT INTO products (model_name, description, category, manufacturer_org_id, notes)
    VALUES (${model_name}, ${description || null}, ${category || null}, ${manufacturer_org_id || null}, ${notes || null})
    RETURNING *
  `;
  await audit({ action: "create", entity_type: "product", entity_id: result[0].id, entity_name: model_name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
