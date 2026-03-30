import { Nav } from "@/components/nav";
import { OrgList } from "@/components/org-list";

export default function OrganisationsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Organisations
          </h1>
          <p className="text-zinc-500 mt-1">
            Companies and organisations linked to people
          </p>
        </div>
        <OrgList />
      </main>
    </>
  );
}
