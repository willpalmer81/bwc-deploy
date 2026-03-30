import { Nav } from "@/components/nav";
import { AcSiteList } from "@/components/ac-site-list";

export default function AcSitesPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Alertacall Sites
          </h1>
          <p className="text-zinc-500 mt-1">
            Warehouse, office, and internal locations
          </p>
        </div>
        <AcSiteList />
      </main>
    </>
  );
}
