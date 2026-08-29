import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const isDbConfigured = Boolean(connectionString);

export const pool = isDbConfigured ? new Pool({ connectionString }) : null;
