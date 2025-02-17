import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { Client } from 'pg'; // 修正
import dotenv from 'dotenv';

dotenv.config();

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err: unknown) => {
    if (err instanceof Error) {
      console.error('Database connection error:', err.message);
    } else {
      console.error('Unexpected error:', err);
    }
  });

export default client;