import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_lT0EBxDtPz8L@ep-shy-boat-a9snaj4v-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

async function migrate() {
  const sql = neon(DATABASE_URL);

  // 1. Create product_properties: defines what fields a product needs
  console.log("Creating product_properties table...");
  await sql`
    CREATE TABLE IF NOT EXISTS product_properties (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      unit TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_props_product ON product_properties(product_id)`;

  // 2. Create site_product_values: stores the actual values per site-product assignment
  console.log("Creating site_product_values table...");
  await sql`
    CREATE TABLE IF NOT EXISTS site_product_values (
      id SERIAL PRIMARY KEY,
      site_product_id INTEGER NOT NULL REFERENCES site_products(id) ON DELETE CASCADE,
      property_id INTEGER NOT NULL REFERENCES product_properties(id) ON DELETE CASCADE,
      value TEXT NOT NULL DEFAULT '0',
      UNIQUE(site_product_id, property_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_spv_site_product ON site_product_values(site_product_id)`;

  // 3. Migrate existing data: for each product that has site_products with
  //    residential_qty/communal_qty/external_qty, create properties and values
  console.log("Migrating existing site_product data...");

  // Find all products that are used in site_products
  const usedProducts = await sql`
    SELECT DISTINCT p.id, p.model_name
    FROM products p
    JOIN site_products sp ON sp.product_id = p.id
  `;

  for (const product of usedProducts) {
    // Check if this product already has properties (idempotent)
    const existingProps = await sql`
      SELECT id FROM product_properties WHERE product_id = ${product.id}
    `;
    if (existingProps.length > 0) {
      console.log(`  ${product.model_name}: already has properties, skipping`);
      continue;
    }

    // Create the 3 legacy properties for this product
    const resProp = await sql`
      INSERT INTO product_properties (product_id, name, label, unit, sort_order)
      VALUES (${product.id}, 'residential_qty', 'Residential', 'dwellings', 0)
      RETURNING id
    `;
    const comProp = await sql`
      INSERT INTO product_properties (product_id, name, label, unit, sort_order)
      VALUES (${product.id}, 'communal_qty', 'Communal', 'units', 1)
      RETURNING id
    `;
    const extProp = await sql`
      INSERT INTO product_properties (product_id, name, label, unit, sort_order)
      VALUES (${product.id}, 'external_qty', 'External', 'units', 2)
      RETURNING id
    `;

    // Migrate values from site_products to site_product_values
    const assignments = await sql`
      SELECT id, residential_qty, communal_qty, external_qty
      FROM site_products WHERE product_id = ${product.id}
    `;

    for (const sp of assignments) {
      if (sp.residential_qty > 0) {
        await sql`
          INSERT INTO site_product_values (site_product_id, property_id, value)
          VALUES (${sp.id}, ${resProp[0].id}, ${String(sp.residential_qty)})
          ON CONFLICT (site_product_id, property_id) DO NOTHING
        `;
      }
      if (sp.communal_qty > 0) {
        await sql`
          INSERT INTO site_product_values (site_product_id, property_id, value)
          VALUES (${sp.id}, ${comProp[0].id}, ${String(sp.communal_qty)})
          ON CONFLICT (site_product_id, property_id) DO NOTHING
        `;
      }
      if (sp.external_qty > 0) {
        await sql`
          INSERT INTO site_product_values (site_product_id, property_id, value)
          VALUES (${sp.id}, ${extProp[0].id}, ${String(sp.external_qty)})
          ON CONFLICT (site_product_id, property_id) DO NOTHING
        `;
      }
    }

    console.log(`  ${product.model_name}: migrated ${assignments.length} assignments`);
  }

  // Also create default properties for products not yet assigned to sites
  const unassignedProducts = await sql`
    SELECT p.id, p.model_name, p.type
    FROM products p
    LEFT JOIN product_properties pp ON pp.product_id = p.id
    WHERE pp.id IS NULL
  `;

  for (const product of unassignedProducts) {
    // Default: give dispersed-alarm-style products the 3 qty fields
    // Others get a simple "quantity" field
    const isDispersed = product.type === "dispersed_alarm" ||
      product.model_name?.toLowerCase().includes("alarm") ||
      product.model_name?.toLowerCase().includes("cariss");

    if (isDispersed) {
      await sql`INSERT INTO product_properties (product_id, name, label, unit, sort_order) VALUES (${product.id}, 'residential_qty', 'Residential', 'dwellings', 0)`;
      await sql`INSERT INTO product_properties (product_id, name, label, unit, sort_order) VALUES (${product.id}, 'communal_qty', 'Communal', 'units', 1)`;
      await sql`INSERT INTO product_properties (product_id, name, label, unit, sort_order) VALUES (${product.id}, 'external_qty', 'External', 'units', 2)`;
    } else {
      await sql`INSERT INTO product_properties (product_id, name, label, unit, sort_order) VALUES (${product.id}, 'quantity', 'Quantity', 'units', 0)`;
    }

    console.log(`  ${product.model_name}: created default properties (${isDispersed ? "dispersed" : "simple"})`);
  }

  // 4. Drop old columns from site_products (after data is migrated)
  console.log("Dropping old qty columns from site_products...");
  await sql`ALTER TABLE site_products DROP COLUMN IF EXISTS residential_qty`;
  await sql`ALTER TABLE site_products DROP COLUMN IF EXISTS communal_qty`;
  await sql`ALTER TABLE site_products DROP COLUMN IF EXISTS external_qty`;

  console.log("Migration complete.");
}

migrate().catch(console.error);
