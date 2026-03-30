import { Nav } from "@/components/nav";
import { AuditLog } from "@/components/audit-log";

export default function AuditPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Audit Log
          </h1>
          <p className="text-zinc-500 mt-1">
            Recent changes across the system
          </p>
        </div>
        <AuditLog />
      </main>
    </>
  );
}
