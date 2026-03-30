import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const arcs = await sql`SELECT * FROM arcs ORDER BY name`;
  return NextResponse.json(arcs);
}

export async function POST(request: Request) {
  const sql = getDb();
  const body = await request.json();
  const { name, notes } = body;
  const result = await sql`
    INSERT INTO arcs (name, notes)
    VALUES (${name}, ${notes || null})
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}
