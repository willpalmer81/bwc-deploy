import { describe, it, expect } from "vitest";

// The config inheritance model:
// Sites belong to a cohort, which belongs to a client (org with client_details).
// Cohorts can override client-level defaults for: arc, routing_mode, contact.
// The SQL uses COALESCE(cohort_value, client_value) so cohort wins if set.
//
// This test exercises the COALESCE logic as a pure function, mirroring
// what the database does in src/app/api/sites/route.ts lines 18-19.

type ClientDefaults = {
  arc_name: string | null;
  routing_mode: string | null;
  contact_name: string | null;
};

type CohortOverrides = {
  arc_name: string | null;
  routing_mode: string | null;
  contact_name: string | null;
};

type EffectiveConfig = {
  effective_arc: string | null;
  effective_routing_mode: string | null;
  effective_contact: string | null;
};

function resolveConfig(
  client: ClientDefaults,
  cohort: CohortOverrides | null
): EffectiveConfig {
  return {
    effective_arc: cohort?.arc_name ?? client.arc_name,
    effective_routing_mode: cohort?.routing_mode ?? client.routing_mode,
    effective_contact: cohort?.contact_name ?? client.contact_name,
  };
}

describe("config inheritance: cohort overrides client defaults", () => {
  const clientDefaults: ClientDefaults = {
    arc_name: "Default ARC Ltd",
    routing_mode: "sequential",
    contact_name: "Jane Client",
  };

  it("uses client defaults when cohort has no overrides", () => {
    const cohort: CohortOverrides = {
      arc_name: null,
      routing_mode: null,
      contact_name: null,
    };
    const config = resolveConfig(clientDefaults, cohort);
    expect(config).toEqual({
      effective_arc: "Default ARC Ltd",
      effective_routing_mode: "sequential",
      effective_contact: "Jane Client",
    });
  });

  it("uses client defaults when site has no cohort at all", () => {
    const config = resolveConfig(clientDefaults, null);
    expect(config).toEqual({
      effective_arc: "Default ARC Ltd",
      effective_routing_mode: "sequential",
      effective_contact: "Jane Client",
    });
  });

  it("cohort ARC overrides client ARC", () => {
    const cohort: CohortOverrides = {
      arc_name: "Special ARC Co",
      routing_mode: null,
      contact_name: null,
    };
    const config = resolveConfig(clientDefaults, cohort);
    expect(config.effective_arc).toBe("Special ARC Co");
    expect(config.effective_routing_mode).toBe("sequential"); // still client default
    expect(config.effective_contact).toBe("Jane Client"); // still client default
  });

  it("cohort routing_mode overrides client routing_mode", () => {
    const cohort: CohortOverrides = {
      arc_name: null,
      routing_mode: "simultaneous",
      contact_name: null,
    };
    const config = resolveConfig(clientDefaults, cohort);
    expect(config.effective_routing_mode).toBe("simultaneous");
    expect(config.effective_arc).toBe("Default ARC Ltd"); // unchanged
  });

  it("cohort contact overrides client contact", () => {
    const cohort: CohortOverrides = {
      arc_name: null,
      routing_mode: null,
      contact_name: "Bob Cohort",
    };
    const config = resolveConfig(clientDefaults, cohort);
    expect(config.effective_contact).toBe("Bob Cohort");
  });

  it("cohort overrides ALL client defaults when all set", () => {
    const cohort: CohortOverrides = {
      arc_name: "Override ARC",
      routing_mode: "simultaneous",
      contact_name: "Override Contact",
    };
    const config = resolveConfig(clientDefaults, cohort);
    expect(config).toEqual({
      effective_arc: "Override ARC",
      effective_routing_mode: "simultaneous",
      effective_contact: "Override Contact",
    });
  });

  it("handles client with no defaults and no cohort overrides", () => {
    const emptyClient: ClientDefaults = {
      arc_name: null,
      routing_mode: null,
      contact_name: null,
    };
    const config = resolveConfig(emptyClient, null);
    expect(config).toEqual({
      effective_arc: null,
      effective_routing_mode: null,
      effective_contact: null,
    });
  });

  it("handles client with no defaults but cohort provides values", () => {
    const emptyClient: ClientDefaults = {
      arc_name: null,
      routing_mode: null,
      contact_name: null,
    };
    const cohort: CohortOverrides = {
      arc_name: "Cohort ARC",
      routing_mode: "simultaneous",
      contact_name: "Cohort Contact",
    };
    const config = resolveConfig(emptyClient, cohort);
    expect(config).toEqual({
      effective_arc: "Cohort ARC",
      effective_routing_mode: "simultaneous",
      effective_contact: "Cohort Contact",
    });
  });
});

describe("sites filtering logic", () => {
  // Mirrors the filter in src/app/api/sites/route.ts lines 31-43
  type SiteRow = {
    org_id: number;
    status: string;
    name: string | null;
    building_name: string | null;
    postcode: string | null;
  };

  function filterSites(
    sites: SiteRow[],
    filters: { orgId?: string; status?: string; search?: string }
  ): SiteRow[] {
    return sites.filter((site) => {
      if (filters.orgId && site.org_id !== parseInt(filters.orgId))
        return false;
      if (filters.status && site.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          site.name?.toLowerCase().includes(q) ||
          site.building_name?.toLowerCase().includes(q) ||
          site.postcode?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  const sites: SiteRow[] = [
    { org_id: 1, status: "active", name: "Oak House", building_name: "Building A", postcode: "SW1A 1AA" },
    { org_id: 1, status: "pending", name: "Elm Court", building_name: null, postcode: "EC2A 4NE" },
    { org_id: 2, status: "active", name: "Pine Lodge", building_name: "Tower B", postcode: "M1 1AA" },
  ];

  it("returns all sites with no filters", () => {
    expect(filterSites(sites, {})).toHaveLength(3);
  });

  it("filters by org_id", () => {
    const result = filterSites(sites, { orgId: "1" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.org_id === 1)).toBe(true);
  });

  it("filters by status", () => {
    const result = filterSites(sites, { status: "active" });
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.status === "active")).toBe(true);
  });

  it("search matches site name (case-insensitive)", () => {
    const result = filterSites(sites, { search: "oak" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Oak House");
  });

  it("search matches building_name", () => {
    const result = filterSites(sites, { search: "Tower" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Pine Lodge");
  });

  it("search matches postcode", () => {
    const result = filterSites(sites, { search: "EC2A" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Elm Court");
  });

  it("combines org_id + status filters", () => {
    const result = filterSites(sites, { orgId: "1", status: "active" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Oak House");
  });

  it("returns empty when no matches", () => {
    const result = filterSites(sites, { search: "nonexistent" });
    expect(result).toHaveLength(0);
  });
});
