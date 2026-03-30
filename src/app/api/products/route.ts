import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const products = await sql`SELECT * FROM products ORDER BY name`;
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, description, category, notes } = body;
  const result = await sql`
    INSERT INTO products (name, description, category, notes)
    VALUES (${name}, ${description || null}, ${category || null}, ${notes || null})
    RETURNING *
  `;
  await audit({ action: "create", entity_type: "product", entity_id: result[0].id, entity_name: name, changes: body });
  return NextResponse.json(result[0], { status: 201 });
}
