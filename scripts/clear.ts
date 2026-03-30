import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function clear() {
  const sql = neon(DATABASE_URL);
  await sql`TRUNCATE sites, cohorts, clients RESTART IDENTITY CASCADE`;
  console.log("All tables cleared.");
}

clear().catch(console.error);
