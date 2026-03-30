import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Creating arcs table...");
  await sql`
    CREATE TABLE IF NOT EXISTS arcs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT
    )
  `;

  // Migrate existing text arc values into the new table
  const existingClientArcs = await sql`SELECT DISTINCT arc FROM clients WHERE arc IS NOT NULL AND arc != ''`;
  const existingCohortArcs = await sql`SELECT DISTINCT arc FROM cohorts WHERE arc IS NOT NULL AND arc != ''`;
  const allNames = new Set<string>();
  for (const r of [...existingClientArcs, ...existingCohortArcs]) {
    allNames.add(r.arc);
  }

  for (const name of allNames) {
    const exists = await sql`SELECT id FROM arcs WHERE name = ${name}`;
    if (exists.length === 0) {
      await sql`INSERT INTO arcs (name) VALUES (${name})`;
      console.log(`  Migrated ARC: ${name}`);
    }
  }

  // Add arc_id FK columns
  console.log("Adding arc_id to clients...");
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS arc_id INTEGER REFERENCES arcs(id)`;

  console.log("Adding arc_id to cohorts...");
  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS arc_id INTEGER REFERENCES arcs(id)`;

  // Backfill arc_id from text values
  await sql`UPDATE clients SET arc_id = a.id FROM arcs a WHERE clients.arc = a.name AND clients.arc_id IS NULL`;
  await sql`UPDATE cohorts SET arc_id = a.id FROM arcs a WHERE cohorts.arc = a.name AND cohorts.arc_id IS NULL`;

  // Drop old text columns
  console.log("Dropping old text arc columns...");
  await sql`ALTER TABLE clients DROP COLUMN IF EXISTS arc`;
  await sql`ALTER TABLE cohorts DROP COLUMN IF EXISTS arc`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
