
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = mysql.createPool({
  ...((process.env.DATABASE_URL ? 
    { uri: process.env.DATABASE_URL } : 
    {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test'
    }
  )),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = pool;
