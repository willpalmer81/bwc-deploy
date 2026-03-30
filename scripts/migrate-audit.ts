import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  console.log("Creating audit_log table...");
  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      entity_name TEXT,
      changes JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id)`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
