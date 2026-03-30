import { Nav } from "@/components/nav";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Deployment Overview
          </h1>
          <p className="text-zinc-500 mt-1">
            BWC site rollout status across all clients
          </p>
        </div>
        <Dashboard />
      </main>
    </>
  );
}
