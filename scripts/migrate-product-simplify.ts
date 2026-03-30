import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Renaming category to type...");
  await sql`ALTER TABLE products RENAME COLUMN category TO type`;

  console.log("Dropping description column...");
  await sql`ALTER TABLE products DROP COLUMN IF EXISTS description`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
