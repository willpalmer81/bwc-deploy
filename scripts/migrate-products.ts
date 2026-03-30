import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Creating products table...");
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      notes TEXT
    )
  `;

  console.log("Creating site_products table...");
  await sql`
    CREATE TABLE IF NOT EXISTS site_products (
      id SERIAL PRIMARY KEY,
      site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      residential_qty INTEGER NOT NULL DEFAULT 0,
      communal_qty INTEGER NOT NULL DEFAULT 0,
      external_qty INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_site_products_site ON site_products(site_id)`;

  // Drop old generic unit columns from sites
  console.log("Dropping old unit columns from sites...");
  await sql`ALTER TABLE sites DROP COLUMN IF EXISTS residential_units`;
  await sql`ALTER TABLE sites DROP COLUMN IF EXISTS communal_units`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
