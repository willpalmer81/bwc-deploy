import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Renaming name to model_name on products...");
  await sql`ALTER TABLE products RENAME COLUMN name TO model_name`;

  console.log("Adding manufacturer_org_id to products...");
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer_org_id INTEGER REFERENCES organisations(id)`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
