
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

// CSVファイルの読み込みと処理
async function migrateInspectionData() {
  try {
    // ソースディレクトリとターゲットディレクトリの設定
    const sourceDir = path.join(process.cwd(), 'attached_assets/inspection');
    const targetDir = path.join(process.cwd(), 'attached_assets/inspection/table');

    // ターゲットディレクトリが存在しない場合は作成
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // CSVファイルの読み込み
    const files = fs.readdirSync(sourceDir);
    const csvFile = files.find(file => file.includes('点検項目マスタ'));
    
    if (!csvFile) {
      throw new Error('点検項目マスタファイルが見つかりません');
    }

    const csvData = fs.readFileSync(path.join(sourceDir, csvFile), 'utf8');
    const results = Papa.parse(csvData, { header: true });

    // データの整理
    const manufacturers = new Set();
    const models = new Set();
    const inspectionItems = [];
    const machineNumbers = new Set();

    results.data.forEach((row: any) => {
      if (row['製造メーカー']) manufacturers.add(row['製造メーカー']);
      if (row['機種']) models.add(row['機種']);
      if (row['機械番号']) machineNumbers.add(row['機械番号']);

      if (row['部位'] && row['装置'] && row['確認箇所']) {
        inspectionItems.push({
          category: row['部位'],
          equipment: row['装置'],
          checkPoint: row['確認箇所'],
          criteria: row['判断基準'] || '',
          method: row['確認要領'] || '',
          measurementRecord: row['測定等記録'] || '',
          visualInspection: row['図形記録'] || ''
        });
      }
    });

    // データをCSVファイルとして保存
    const manufacturersData = Array.from(manufacturers).map((name, id) => ({ 
      id: id + 1, 
      name 
    }));
    
    const modelsData = Array.from(models).map((name, id) => ({ 
      id: id + 1, 
      name 
    }));

    const machineNumbersData = Array.from(machineNumbers).map((number, id) => ({
      id: id + 1,
      number
    }));

    const inspectionItemsData = inspectionItems.map((item, id) => ({
      id: id + 1,
      ...item
    }));

    // ファイルの保存
    fs.writeFileSync(
      path.join(targetDir, 'manufacturers.csv'),
      Papa.unparse(manufacturersData)
    );

    fs.writeFileSync(
      path.join(targetDir, 'models.csv'),
      Papa.unparse(modelsData)
    );

    fs.writeFileSync(
      path.join(targetDir, 'machine_numbers.csv'),
      Papa.unparse(machineNumbersData)
    );

    fs.writeFileSync(
      path.join(targetDir, 'inspection_items.csv'),
      Papa.unparse(inspectionItemsData)
    );

    console.log('データ移行が完了しました');
    console.log(`製造メーカー: ${manufacturersData.length}件`);
    console.log(`機種: ${modelsData.length}件`);
    console.log(`機械番号: ${machineNumbersData.length}件`);
    console.log(`点検項目: ${inspectionItemsData.length}件`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

migrateInspectionData().catch(console.error);
