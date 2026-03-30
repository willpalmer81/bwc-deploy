import { Nav } from "@/components/nav";
import { CohortList } from "@/components/cohort-list";

export default function CohortsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Cohorts
          </h1>
          <p className="text-zinc-500 mt-1">
            Deployment cohorts by client
          </p>
        </div>
        <CohortList />
      </main>
    </>
  );
}
