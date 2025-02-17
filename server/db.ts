
import { createConnection } from 'sqlite3';
import { open } from 'sqlite';

export const db = await open({
  filename: './database.sqlite',
  driver: createConnection
});

// テーブル作成
await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT 0
  );
`);
