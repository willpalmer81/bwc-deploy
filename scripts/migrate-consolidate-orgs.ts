import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  // 1. Create client detail table
  console.log("Creating org_client_details...");
  await sql`
    CREATE TABLE IF NOT EXISTS org_client_details (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,
      arc_org_id INTEGER REFERENCES organisations(id),
      routing_mode TEXT NOT NULL DEFAULT 'TBC',
      contact_id INTEGER REFERENCES people(id)
    )
  `;

  // 2. Migrate existing arcs → organisations (type=arc)
  console.log("Migrating arcs to organisations...");
  const arcs = await sql`SELECT * FROM arcs`;
  const arcIdMap: Record<number, number> = {};
  for (const arc of arcs) {
    const existing = await sql`SELECT id FROM organisations WHERE name = ${arc.name} AND type = 'arc'`;
    if (existing.length > 0) {
      arcIdMap[arc.id] = existing[0].id;
    } else {
      const result = await sql`
        INSERT INTO organisations (name, type, notes) VALUES (${arc.name}, 'arc', ${arc.notes})
        RETURNING id
      `;
      arcIdMap[arc.id] = result[0].id;
    }
    console.log(`  ARC: ${arc.name} → org ${arcIdMap[arc.id]}`);
  }

  // 3. Migrate existing clients → organisations (type=client) + org_client_details
  console.log("Migrating clients to organisations...");
  const clients = await sql`SELECT * FROM clients`;
  const clientIdMap: Record<number, number> = {};
  for (const client of clients) {
    const existing = await sql`SELECT id FROM organisations WHERE name = ${client.name} AND type = 'client'`;
    let orgId: number;
    if (existing.length > 0) {
      orgId = existing[0].id;
    } else {
      const result = await sql`
        INSERT INTO organisations (name, type, notes) VALUES (${client.name}, 'client', ${client.notes})
        RETURNING id
      `;
      orgId = result[0].id;
    }
    clientIdMap[client.id] = orgId;

    // Create client details
    const detailExists = await sql`SELECT id FROM org_client_details WHERE org_id = ${orgId}`;
    if (detailExists.length === 0) {
      const arcOrgId = client.arc_id ? arcIdMap[client.arc_id] ?? null : null;
      await sql`
        INSERT INTO org_client_details (org_id, arc_org_id, routing_mode, contact_id)
        VALUES (${orgId}, ${arcOrgId}, ${client.routing_mode || 'TBC'}, ${client.contact_id})
      `;
    }
    console.log(`  Client: ${client.name} → org ${orgId}`);
  }

  // 4. Add new FK columns to sites and cohorts
  console.log("Updating sites...");
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organisations(id)`;
  // Backfill
  for (const [oldId, newId] of Object.entries(clientIdMap)) {
    await sql`UPDATE sites SET org_id = ${newId} WHERE client_id = ${parseInt(oldId)}`;
  }

  console.log("Updating cohorts...");
  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organisations(id)`;
  await sql`ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS arc_org_id INTEGER REFERENCES organisations(id)`;
  // Backfill
  for (const [oldId, newId] of Object.entries(clientIdMap)) {
    await sql`UPDATE cohorts SET org_id = ${newId} WHERE client_id = ${parseInt(oldId)}`;
  }
  const cohortArcs = await sql`SELECT id, arc_id FROM cohorts WHERE arc_id IS NOT NULL`;
  for (const co of cohortArcs) {
    const newArcId = arcIdMap[co.arc_id];
    if (newArcId) {
      await sql`UPDATE cohorts SET arc_org_id = ${newArcId} WHERE id = ${co.id}`;
    }
  }

  // 5. Drop old columns and tables
  console.log("Dropping old columns...");
  await sql`ALTER TABLE sites DROP COLUMN IF EXISTS client_id`;
  await sql`ALTER TABLE cohorts DROP COLUMN IF EXISTS client_id`;
  await sql`ALTER TABLE cohorts DROP COLUMN IF EXISTS arc_id`;

  console.log("Dropping old tables...");
  await sql`DROP TABLE IF EXISTS clients CASCADE`;
  await sql`DROP TABLE IF EXISTS arcs CASCADE`;

  console.log("Migration complete!");
  const orgCount = await sql`SELECT count(*)::int as c FROM organisations`;
  const detailCount = await sql`SELECT count(*)::int as c FROM org_client_details`;
  console.log(`  ${orgCount[0].c} organisations, ${detailCount[0].c} client details`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
