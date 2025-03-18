import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { db } from '../server/db';

async function migrateInspectionData() {
  try {
    const sourceDir = path.join(process.cwd(), 'attached_assets/inspection');
    const targetDir = path.join(process.cwd(), 'attached_assets/inspection/table');

    // テーブルデータ保存用のディレクトリを作成
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log('テーブルデータ保存用のディレクトリを作成しました:', targetDir);
    }

    // 仕業点検マスタファイルを読み込み
    const sourceFile = path.join(sourceDir, '仕業点検マスタ.csv');
    if (!fs.existsSync(sourceFile)) {
      throw new Error('仕業点検マスタファイルが見つかりません');
    }

    const csvData = fs.readFileSync(sourceFile, 'utf8');
    const results = Papa.parse(csvData, { header: true });

    // 各テーブル用のデータを格納する配列
    const manufacturers = new Set();
    const models = new Set();
    const inspectionItems = [];

    results.data.forEach((row: any) => {
      if (row['製造メーカー']) {
        manufacturers.add(row['製造メーカー']);
      }
      if (row['機種']) {
        models.add(row['機種']);
      }

      // 点検項目データを作成
      if (row['部位'] && row['装置'] && row['確認箇所']) {
        inspectionItems.push({
          category: row['部位'],
          equipment: row['装置'],
          item: row['確認箇所'],
          criteria: row['判断基準'] || '',
          method: row['確認要領'] || '',
          measurementRecord: row['測定等記録'] || '',
          visualInspection: row['図形記録'] || ''
        });
      }
    });

    // 各テーブルのデータをCSVファイルとして保存
    const manufacturersData = Array.from(manufacturers).map(name => ({ name }));
    const modelsData = Array.from(models).map(name => ({ name }));

    // 点検項目データに判断基準と確認要領を含める
    const inspectionItemsData = inspectionItems.map(item => ({
      category: item.category,
      equipment: item.equipment,
      item: item.item,
      criteria: item.criteria,
      method: item.method,
      measurementRecord: item.measurementRecord,
      visualInspection: item.visualInspection
    }));

    // ファイルに保存
    fs.writeFileSync(
      path.join(targetDir, 'manufacturers.csv'),
      Papa.unparse(manufacturersData)
    );

    fs.writeFileSync(
      path.join(targetDir, 'models.csv'),
      Papa.unparse(modelsData)
    );

    fs.writeFileSync(
      path.join(targetDir, 'inspection_items.csv'),
      Papa.unparse(inspectionItemsData)
    );

    console.log('データ移行が完了しました');
    console.log(`製造メーカー: ${manufacturersData.length}件`);
    console.log(`機種: ${modelsData.length}件`);
    console.log(`点検項目: ${inspectionItems.length}件`);

  } catch (error) {
    console.error('データ移行エラー:', error);
    throw error;
  }
}

migrateInspectionData().catch(console.error);