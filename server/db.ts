
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectTimeout: 30000,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
export const db = pool;
