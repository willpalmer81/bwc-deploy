import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const people = await sql`
    SELECT p.*, o.name as org_name, o.type as org_type
    FROM people p
    LEFT JOIN organisations o ON p.org_id = o.id
    ORDER BY p.name
  `;
  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, email, phone, role, org_id, notes } = body;
  const result = await sql`
    INSERT INTO people (name, email, phone, role, org_id, notes)
    VALUES (${name}, ${email || null}, ${phone || null}, ${role || null}, ${org_id || null}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
