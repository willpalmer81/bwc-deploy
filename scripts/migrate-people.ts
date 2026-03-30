import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Creating people table...");
  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT,
      notes TEXT
    )
  `;

  // Add contact_id FK to clients and cohorts
  console.log("Adding contact_id to clients...");
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES people(id)`;

  console.log("Adding contact_id to cohorts...");
  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES people(id)`;

  // Drop old text columns
  console.log("Dropping old alertacall_contact columns...");
  await sql`ALTER TABLE clients DROP COLUMN IF EXISTS alertacall_contact`;
  await sql`ALTER TABLE cohorts DROP COLUMN IF EXISTS alertacall_contact`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
