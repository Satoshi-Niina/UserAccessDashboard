
import sqlite3 from 'sqlite3';
import { open } from 'sqlite3';

// SQLiteデータベースの接続設定
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// ユーザーテーブルの作成
// - id: 主キー（自動増分）
// - username: ユーザー名（一意）
// - password: ハッシュ化されたパスワード
// - is_admin: 管理者フラグ
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT 0
  )
`);

export { db };
