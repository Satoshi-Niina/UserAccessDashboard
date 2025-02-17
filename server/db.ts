
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = mysql.createPool({
  host: '0.0.0.0',
  user: 'root',
  password: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
export const db = pool;
