import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const logs = await sql`
    SELECT * FROM audit_log
    ORDER BY created_at DESC
    LIMIT 200
  `;
  return NextResponse.json(logs);
}
