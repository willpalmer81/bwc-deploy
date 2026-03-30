import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function seed() {
  const sql = neon(DATABASE_URL);

  console.log("Dropping existing tables...");
  await sql`DROP TABLE IF EXISTS sites CASCADE`;
  await sql`DROP TABLE IF EXISTS cohorts CASCADE`;
  await sql`DROP TABLE IF EXISTS clients CASCADE`;
  await sql`DROP TABLE IF EXISTS ac_sites CASCADE`;

  console.log("Creating tables...");

  await sql`
    CREATE TABLE clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      arc TEXT NOT NULL,
      routing_mode TEXT NOT NULL,
      alertacall_contact TEXT NOT NULL,
      notes TEXT
    )
  `;

  await sql`
    CREATE TABLE cohorts (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id),
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      arc TEXT,
      routing_mode TEXT,
      alertacall_contact TEXT,
      notes TEXT
    )
  `;

  await sql`
    CREATE TABLE sites (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id),
      cohort_id INTEGER REFERENCES cohorts(id),
      name TEXT NOT NULL,
      building_name TEXT,
      address TEXT,
      postcode TEXT,
      residential_units INTEGER,
      communal_units INTEGER,
      dmp_group_name TEXT,
      dmp_group_uuid TEXT,
      status TEXT NOT NULL,
      notes TEXT
    )
  `;

  await sql`
    CREATE TABLE ac_sites (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      postcode TEXT,
      notes TEXT
    )
  `;

  console.log("Seeding clients...");

  const clientRows = await sql`
    INSERT INTO clients (name, arc, routing_mode, alertacall_contact) VALUES
      ('St Monica Trust', 'Skyresponse', 'via_skyresponse', 'Will Palmer'),
      ('Abbeyfield', 'Taking Care', 'direct_to_arc', 'Kerry Surman'),
      ('Housing 21', 'Appello', 'direct_to_arc', 'Iain Wild'),
      ('Bromford', 'Appello', 'direct_to_arc', 'Iain Wild'),
      ('St John & St Anne''s', 'Mole Valley', 'TBC', 'Iain Wild')
    RETURNING id, name
  `;

  const clientMap: Record<string, number> = {};
  for (const row of clientRows) {
    clientMap[row.name] = row.id;
  }

  console.log("Seeding cohorts...");

  const cohortRows = await sql`
    INSERT INTO cohorts (client_id, name, status) VALUES
      (${clientMap["Abbeyfield"]}, 'Cohort 1', 'complete'),
      (${clientMap["Abbeyfield"]}, 'Cohort 2', 'complete'),
      (${clientMap["Abbeyfield"]}, 'Cohort 2b', 'in_progress'),
      (${clientMap["Abbeyfield"]}, 'Cohort 3', 'planning')
    RETURNING id, name
  `;

  const cohortMap: Record<string, number> = {};
  for (const row of cohortRows) {
    cohortMap[row.name] = row.id;
  }

  console.log("Seeding sites...");

  const abbeyfield = clientMap["Abbeyfield"];
  const smt = clientMap["St Monica Trust"];
  const h21 = clientMap["Housing 21"];
  const bromford = clientMap["Bromford"];

  // Abbeyfield Cohort 1 (live)
  await sql`
    INSERT INTO sites (client_id, cohort_id, name, building_name, residential_units, dmp_group_name, status) VALUES
      (${abbeyfield}, ${cohortMap["Cohort 1"]}, 'Quorn', 'Holloway House', 14, 'Quorn', 'live'),
      (${abbeyfield}, ${cohortMap["Cohort 1"]}, 'Lincoln', 'Woburn Avenue', 14, 'Lincoln', 'live')
  `;

  // Abbeyfield Cohort 2 (live)
  await sql`
    INSERT INTO sites (client_id, cohort_id, name, building_name, residential_units, dmp_group_name, status) VALUES
      (${abbeyfield}, ${cohortMap["Cohort 2"]}, 'Corbridge', 'Riverhill', 15, 'Corbridge', 'live'),
      (${abbeyfield}, ${cohortMap["Cohort 2"]}, 'Garstang', 'Church Street', 15, 'Garstang', 'live'),
      (${abbeyfield}, ${cohortMap["Cohort 2"]}, 'Ulverston', 'Victoria Road', 13, 'Ulverston', 'live'),
      (${abbeyfield}, ${cohortMap["Cohort 2"]}, 'Bolton-le-Sands', 'Bolton Lodge / Proctor House', 21, 'Bolton-le-Sands', 'live'),
      (${abbeyfield}, ${cohortMap["Cohort 2"]}, 'Stockport', 'High Lane', 21, 'Stockport', 'live'),
      (${abbeyfield}, ${cohortMap["Cohort 2"]}, 'Nottingham', 'Larch House', 27, 'Nottingham', 'live')
  `;

  // Abbeyfield Cohort 2b (in_progress)
  await sql`
    INSERT INTO sites (client_id, cohort_id, name, building_name, postcode, residential_units, communal_units, dmp_group_name, status) VALUES
      (${abbeyfield}, ${cohortMap["Cohort 2b"]}, 'Settle', 'Abbeyfield House', 'BD24 9RB', 13, 5, 'Dales Scheme c2b', 'in_progress'),
      (${abbeyfield}, ${cohortMap["Cohort 2b"]}, 'Barnoldswick', NULL, 'BB18 5JX', 12, NULL, NULL, 'in_progress'),
      (${abbeyfield}, ${cohortMap["Cohort 2b"]}, 'Leyland', NULL, 'BD9 5QU', 4, NULL, NULL, 'in_progress')
  `;

  // Abbeyfield Cohort 3 (planning)
  await sql`
    INSERT INTO sites (client_id, cohort_id, name, building_name, postcode, status, notes) VALUES
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Sunderland', 'Hope Bank View', 'SR3 1EB', 'planning', 'Contact: Kerrice Cavanagh'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Horsted Keynes', 'Westall House', 'RH17 7BS', 'planning', 'Contact: Elizabeth Wickens'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Cambridge', 'Girton Green', 'CB3 0GQ', 'planning', 'Contact: Sophie Hughes'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Malmesbury', 'Burnham Court', 'SN16 0FN', 'planning', 'Contact: Gil Anies'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Tunbridge Wells', 'Hale Court', 'TN4 9QX', 'planning', 'Contact: Karen Barrett'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Southampton', 'Locks Heath', 'SO31 6BF', 'planning', 'Contact: Lucy Perry'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Whitby', 'Esk Moors Lodge', 'YO21 2ED', 'planning', 'Contact: Bev Venant'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Solihull', 'Hampton House', 'B91 2QT', 'planning', 'Contact: Nicola Kirkham'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Wellington', 'Ivy House', 'TA21 8LL', 'planning', 'Contact: Rebecca South'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Wellington', 'The Old Vicarage', 'TA21 8RF', 'planning', NULL),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Salisbury', 'Macgregor House', 'SP1 1JT', 'planning', 'Contact: Lucy Perry'),
      (${abbeyfield}, ${cohortMap["Cohort 3"]}, 'Salisbury', 'Boldre House', 'SP1 1JT', 'planning', NULL)
  `;

  // SMT sites (all live)
  await sql`
    INSERT INTO sites (client_id, name, dmp_group_name, status) VALUES
      (${smt}, 'Westbury Fields', 'Westbury Fields', 'live'),
      (${smt}, 'Sandford Station', 'Sandford Station', 'live'),
      (${smt}, 'Monica Wills House', 'Monica Wills House', 'live'),
      (${smt}, 'Cote Lane', 'Cote Lane', 'live')
  `;

  // Housing 21
  await sql`
    INSERT INTO sites (client_id, name, status) VALUES
      (${h21}, 'Leverhulme Court', 'live')
  `;

  // Bromford
  await sql`
    INSERT INTO sites (client_id, name, status) VALUES
      (${bromford}, 'Sourton Place', 'live')
  `;

  console.log("Seed complete!");
  console.log(
    `  ${Object.keys(clientMap).length} clients, ${Object.keys(cohortMap).length} cohorts`
  );

  const siteCount = await sql`SELECT count(*)::int as count FROM sites`;
  console.log(`  ${siteCount[0].count} sites`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
