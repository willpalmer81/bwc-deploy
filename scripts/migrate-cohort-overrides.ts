import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Adding override columns to cohorts...");

  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS arc TEXT`;
  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS routing_mode TEXT`;
  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS alertacall_contact TEXT`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
