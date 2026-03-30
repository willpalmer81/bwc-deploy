import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const people = await sql`SELECT * FROM people ORDER BY name`;
  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, email, phone, role, notes } = body;
  const result = await sql`
    INSERT INTO people (name, email, phone, role, notes)
    VALUES (${name}, ${email || null}, ${phone || null}, ${role || null}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
