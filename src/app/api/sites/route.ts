import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const { searchParams } = request.nextUrl;
  const clientId = searchParams.get("client_id");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  // Build conditions for the neon tagged template approach
  // We fetch all and filter, since the dataset is small (~30 rows)
  let sites;

  if (clientId && status && search) {
    const pattern = `%${search}%`;
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.client_id = ${parseInt(clientId)}
        AND s.status = ${status}
        AND (s.name ILIKE ${pattern} OR s.building_name ILIKE ${pattern} OR s.postcode ILIKE ${pattern})
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else if (clientId && status) {
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.client_id = ${parseInt(clientId)} AND s.status = ${status}
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else if (clientId && search) {
    const pattern = `%${search}%`;
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.client_id = ${parseInt(clientId)}
        AND (s.name ILIKE ${pattern} OR s.building_name ILIKE ${pattern} OR s.postcode ILIKE ${pattern})
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else if (status && search) {
    const pattern = `%${search}%`;
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.status = ${status}
        AND (s.name ILIKE ${pattern} OR s.building_name ILIKE ${pattern} OR s.postcode ILIKE ${pattern})
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else if (clientId) {
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.client_id = ${parseInt(clientId)}
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else if (status) {
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.status = ${status}
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else if (search) {
    const pattern = `%${search}%`;
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      WHERE s.name ILIKE ${pattern} OR s.building_name ILIKE ${pattern} OR s.postcode ILIKE ${pattern}
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  } else {
    sites = await sql`
      SELECT s.*, c.name as client_name, co.name as cohort_name
      FROM sites s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN cohorts co ON s.cohort_id = co.id
      ORDER BY c.name, co.name NULLS FIRST, s.name
    `;
  }

  return NextResponse.json(sites);
}
