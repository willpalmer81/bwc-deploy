import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

export type Organisation = {
  id: number;
  name: string;
  type: string;
  notes: string | null;
};

export type OrgClientDetails = {
  id: number;
  org_id: number;
  arc_org_id: number | null;
  routing_mode: string;
  contact_id: number | null;
};

export type Cohort = {
  id: number;
  org_id: number;
  name: string;
  arc_org_id: number | null;
  routing_mode: string | null;
  contact_id: number | null;
  notes: string | null;
  client_name?: string;
};

export type Site = {
  id: number;
  org_id: number;
  cohort_id: number | null;
  name: string;
  building_name: string | null;
  address: string | null;
  postcode: string | null;
  residential_units: number | null;
  communal_units: number | null;
  dmp_group_name: string | null;
  dmp_group_uuid: string | null;
  status: string;
  notes: string | null;
  client_name?: string;
  cohort_name?: string;
  effective_arc?: string;
  effective_routing_mode?: string;
  effective_contact?: string;
};
