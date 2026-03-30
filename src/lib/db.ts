import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

export type Client = {
  id: number;
  name: string;
  arc: string;
  routing_mode: string;
  alertacall_contact: string;
  notes: string | null;
};

export type Cohort = {
  id: number;
  client_id: number;
  name: string;
  status: string;
  notes: string | null;
  client_name?: string;
};

export type Site = {
  id: number;
  client_id: number;
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
};
