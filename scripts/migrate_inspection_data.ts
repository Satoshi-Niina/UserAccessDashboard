
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { db } from '../server/db';

async function migrateInspectionData() {
  try {
    const assetsDir = path.join(process.cwd(), 'attached_assets/inspection');

    // Create directories if they don't exist
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Manufacturers migration
    const manufacturersFile = path.join(assetsDir, 'manufacturers_master.csv');
    if (fs.existsSync(manufacturersFile)) {
      const manufacturersData = fs.readFileSync(manufacturersFile, 'utf8');
      const manufacturers = Papa.parse(manufacturersData, { header: true }).data;

      for (const manufacturer of manufacturers) {
        await db.run(`
          INSERT OR IGNORE INTO manufacturers (name, code)
          VALUES (?, ?)
        `, [manufacturer.name, manufacturer.code]);
      }
    }

    // Models migration
    const modelsFile = path.join(assetsDir, 'models_master.csv');
    if (fs.existsSync(modelsFile)) {
      const modelsData = fs.readFileSync(modelsFile, 'utf8');
      const models = Papa.parse(modelsData, { header: true }).data;

      for (const model of models) {
        const manufacturer = await db.get(`
          SELECT id FROM manufacturers WHERE code = ?
        `, [model.manufacturer_code]);

        if (manufacturer) {
          await db.run(`
            INSERT OR IGNORE INTO models (manufacturer_id, name, code)
            VALUES (?, ?, ?)
          `, [manufacturer.id, model.name, model.code]);
        }
      }
    }

    // Inspection items migration
    const itemsFile = path.join(assetsDir, 'inspection_items_master.csv');
    if (fs.existsSync(itemsFile)) {
      const itemsData = fs.readFileSync(itemsFile, 'utf8');
      const items = Papa.parse(itemsData, { header: true }).data;

      for (const item of items) {
        const model = await db.get(`
          SELECT id FROM models WHERE code = ?
        `, [item.model_code]);

        if (model) {
          const result = await db.run(`
            INSERT INTO inspection_items 
            (model_id, category, sub_category, item_name, check_method, judgment_criteria)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [model.id, item.category, item.sub_category, item.item_name,
              item.check_method, item.judgment_criteria]);

          if (item.min_value || item.max_value) {
            await db.run(`
              INSERT INTO measurement_records 
              (inspection_item_id, min_value, max_value, unit)
              VALUES (?, ?, ?, ?)
            `, [result.lastID, item.min_value, item.max_value, item.unit]);
          }

          if (item.image_reference) {
            await db.run(`
              INSERT INTO visual_inspection_records 
              (inspection_item_id, image_reference, description)
              VALUES (?, ?, ?)
            `, [result.lastID, item.image_reference, item.description]);
          }
        }
      }
    }

    console.log('データ移行が完了しました');
  } catch (error) {
    console.error('データ移行エラー:', error);
    throw error;
  }
}

migrateInspectionData().catch(console.error);
