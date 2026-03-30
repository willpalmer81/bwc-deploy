import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const orgs = await sql`SELECT * FROM organisations ORDER BY type, name`;
  return NextResponse.json(orgs);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, type, notes } = body;
  const result = await sql`
    INSERT INTO organisations (name, type, notes)
    VALUES (${name}, ${type || "other"}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
