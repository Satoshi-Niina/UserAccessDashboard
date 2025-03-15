
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { db } from '../server/db';

async function migrateInspectionData() {
  try {
    // 最新の仕業点検マスタファイルを取得
    const inspectionDir = path.join(process.cwd(), 'attached_assets/inspection');
    const files = fs.readdirSync(inspectionDir);
    const masterFiles = files.filter(file => file.includes('仕業点検マスタ') && file.endsWith('.csv'));
    
    if (masterFiles.length === 0) {
      console.error('仕業点検マスタファイルが見つかりません');
      return;
    }

    // 最新のファイルを使用
    masterFiles.sort();
    const latestFile = masterFiles[masterFiles.length - 1];
    const filePath = path.join(inspectionDir, latestFile);
    
    // CSVファイルを読み込み
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const results = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    // 製造メーカーテーブルの作成と移行
    await db.run(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    // 車種テーブルの作成と移行
    await db.run(`
      CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manufacturer_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
      )
    `);

    // カテゴリーテーブルの作成と移行
    await db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);

    // 装置テーブルの作成と移行
    await db.run(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // データの移行
    for (const row of results.data) {
      // 製造メーカーの追加
      const manufacturer = row['製造メーカー'] || row.manufacturer;
      if (manufacturer) {
        await db.run(
          'INSERT OR IGNORE INTO manufacturers (name) VALUES (?)',
          [manufacturer]
        );
      }

      // 車種の追加
      const model = row['機種'] || row.model;
      if (manufacturer && model) {
        const manufacturerResult = await db.get(
          'SELECT id FROM manufacturers WHERE name = ?',
          [manufacturer]
        );
        if (manufacturerResult) {
          await db.run(
            'INSERT OR IGNORE INTO models (manufacturer_id, name) VALUES (?, ?)',
            [manufacturerResult.id, model]
          );
        }
      }

      // カテゴリーの追加
      const category = row['部位'] || row.category;
      if (category) {
        await db.run(
          'INSERT OR IGNORE INTO categories (name) VALUES (?)',
          [category]
        );
      }

      // 装置の追加
      const equipment = row['装置'] || row.equipment;
      if (category && equipment) {
        const categoryResult = await db.get(
          'SELECT id FROM categories WHERE name = ?',
          [category]
        );
        if (categoryResult) {
          await db.run(
            'INSERT OR IGNORE INTO equipment (category_id, name) VALUES (?, ?)',
            [categoryResult.id, equipment]
          );
        }
      }
    }

    console.log('データ移行が完了しました');
  } catch (error) {
    console.error('データ移行エラー:', error);
  }
}

migrateInspectionData();
