import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  // Add status column to site_products (defaults to the parent site's status)
  console.log("Adding status column to site_products...");
  await sql`ALTER TABLE site_products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planning'`;

  // Copy the site status to each existing site_product so they start in sync
  console.log("Syncing existing site_product statuses from parent sites...");
  await sql`
    UPDATE site_products sp
    SET status = s.status
    FROM sites s
    WHERE sp.site_id = s.id
      AND sp.status = 'planning'
      AND s.status != 'planning'
  `;

  console.log("Migration complete.");
}

migrate().catch(console.error);
