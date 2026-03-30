import { getDb } from "./db";
import { auth } from "./auth";

type AuditEntry = {
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id?: number;
  entity_name?: string;
  changes?: Record<string, unknown>;
};

export async function audit(entry: AuditEntry) {
  const session = await auth();
  const email = session?.user?.email ?? "unknown";
  const name = session?.user?.name ?? null;

  const sql = getDb();
  await sql`
    INSERT INTO audit_log (user_email, user_name, action, entity_type, entity_id, entity_name, changes)
    VALUES (${email}, ${name}, ${entry.action}, ${entry.entity_type}, ${entry.entity_id ?? null}, ${entry.entity_name ?? null}, ${JSON.stringify(entry.changes ?? null)})
  `;
}
