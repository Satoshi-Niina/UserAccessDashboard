import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { promisify } from 'util';

const INSPECTION_FILES_DIR = path.join(process.cwd(), 'attached_assets');
const inspectionItemsDir = INSPECTION_FILES_DIR; // Added for clarity

async function readCsvFile(filePath: string) {
  const fileContent = await fs.promises.readFile(filePath, 'utf8');
  return Papa.parse(fileContent, { header: true }).data;
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const user = req.user;
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1
      })));
    } catch (error) {
      console.error("ユーザー一覧取得エラー:", error);
      res.status(500).json({ error: "ユーザー一覧の取得に失敗しました" });
    }
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }
    if (!req.user || req.user.is_admin !== 1) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const { username, password, isAdmin } = req.body;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "ユーザー名が既に存在します" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        is_admin: isAdmin ? 1 : 0
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1
      });
    } catch (error) {
      console.error("ユーザー登録エラー:", error);
      res.status(500).json({ error: "ユーザー登録に失敗しました" });
    }
  });

  // 点検項目データを取得するエンドポイント
  app.get('/api/inspection-items', async (req, res) => {
    try {
      // CSVファイルからデータを読み込む
      const useLatest = req.query.useLatest === 'true';

      // 最新のCSVファイルを探す
      let csvFilePath;
      if (useLatest) {
        const assetsDir = path.join(process.cwd(), 'attached_assets');
        const files = await fs.promises.readdir(assetsDir);
        // CSVファイルだけをフィルタリング
        const csvFiles = files.filter(file => file.endsWith('.csv') && file.includes('仕業点検マスタ'));

        if (csvFiles.length > 0) {
          // 最新のファイルを取得（ファイル名でソート）
          csvFiles.sort();
          const latestFile = csvFiles[csvFiles.length - 1];
          csvFilePath = path.join(assetsDir, latestFile);
          console.log('CSVヘッダー:', csvFilePath);
        } else {
          // CSVファイルが見つからない場合はデフォルトを使用
          csvFilePath = path.join(process.cwd(), 'attached_assets/仕業点検マスタ.csv');
        }
      } else {
        // デフォルトのCSVファイル
        csvFilePath = path.join(process.cwd(), 'attached_assets/仕業点検マスタ.csv');
      }

      const data = await readCsvFile(csvFilePath);
      res.json(data);
    } catch (error) {
      console.error('Error loading inspection items:', error);
      res.status(500).json({ error: 'データの読み込みに失敗しました' });
    }
  });


  app.post('/api/upload-inspection-items', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const multer = require('multer');
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 } 
    }).single('file');

    upload(req, res, function(err) {
      if (err) {
        console.error('ファイルアップロードエラー:', err);
        return res.status(500).json({ error: 'ファイルアップロードに失敗しました' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'ファイルが提供されていません' });
      }

      try {
        const assetsDir = path.join(process.cwd(), 'attached_assets');
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }

        let fileName = req.query.fileName as string;

        if (!fileName) {
          const originalFilename = req.file.originalname;
          const now = new Date();
          const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
          const baseName = originalFilename.replace(/\.csv$/i, '');
          fileName = `${baseName}_${dateStr}.csv`;
        }

        const csvFilePath = path.join(assetsDir, fileName);

        fs.writeFileSync(csvFilePath, req.file.buffer);

        console.log(`CSVファイルを保存しました: ${csvFilePath} (${req.file.buffer.length} バイト)`);

        res.status(200).json({ 
          message: 'ファイルが正常にアップロードされました',
          fileName: fileName,
          size: req.file.buffer.length
        });
      } catch (error) {
        console.error('ファイル保存エラー:', error);
        res.status(500).json({ error: 'ファイルの保存に失敗しました' });
      }
    });
  });

  app.post('/api/save-inspection-data', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    try {
      const { sourceFileName, data, fileName, inspectionRecord } = req.body;

      if (!data) {
        return res.status(400).json({ error: '保存するデータがありません' });
      }

      const outputFileName = fileName || `仕業点検_編集済_${new Date().toISOString().slice(0, 10)}.csv`;

      const assetsDir = path.join(process.cwd(), 'attached_assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const sourceFilePath = path.join(assetsDir, sourceFileName || '仕業点検マスタ.csv');

      let originalHeaders = [];
      if (sourceFileName && fs.existsSync(sourceFilePath)) {
        try {
          const sourceContent = fs.readFileSync(sourceFilePath, 'utf8');
          const firstLine = sourceContent.split('\n')[0];
          originalHeaders = firstLine.split(',').map(header => header.trim());
        } catch (err) {
          console.warn('元のCSVファイルからヘッダーを取得できませんでした:', err);
        }
      }

      const fieldMapping = {
        'manufacturer': '製造メーカー',
        'model': '機種',
        'engineType': 'エンジン型式',
        'category': '部位',
        'equipment': '装置',
        'item': '確認箇所',
        'criteria': '判断基準',
        'method': '確認要領',
        'measurementRecord': '測定等記録',
        'diagramRecord': '図形記録'
      };

      const processedData = data.map(item => {
        const newItem = { ...item };

        Object.entries(fieldMapping).forEach(([engField, jpField]) => {
          if (item[engField] !== undefined && item[engField] !== null) {
            newItem[jpField] = item[engField];
          }
        });

        return newItem;
      });

      let headerComments = '';
      if (inspectionRecord) {
        const record = inspectionRecord;
        headerComments = [
          `#点検年月日: ${record.点検年月日 || ''}`,
          `#開始時刻: ${record.開始時刻 || ''}`,
          `#終了時刻: ${record.終了時刻 || ''}`,
          `#実施箇所: ${record.実施箇所 || ''}`,
          `#責任者: ${record.責任者 || ''}`,
          `#点検者: ${record.点検者 || ''}`,
          `#引継ぎ: ${record.引継ぎ || ''}`,
          ''
        ].join('\n') + '\n';
      }

      let csvContent = '';
      if (originalHeaders.length > 0) {
        console.log('元のヘッダーを使用します:', originalHeaders);

        const newKeys = Object.keys(processedData[0] || {});

        newKeys.forEach(key => {
          if (!originalHeaders.includes(key)) {
            originalHeaders.push(key);
            console.log('新しいフィールドを追加しました:', key);
          }
        });

        csvContent = Papa.unparse({
          fields: originalHeaders,
          data: processedData
        }, {
          header: true,
          delimiter: ',',
          quoteChar: '"'
        });
      } else {
        csvContent = Papa.unparse(processedData, {
          header: true,
          delimiter: ',',
          quoteChar: '"'
        });
      }

      if (headerComments) {
        csvContent = headerComments + csvContent;
      }

      const csvFilePath = path.join(assetsDir, outputFileName);

      fs.writeFileSync(csvFilePath, csvContent, 'utf8');

      const inspectionRecordData = inspectionRecord || {};
      const inspectionRecordPath = path.join(assetsDir, `${outputFileName.replace('.csv', '')}_record.json`);
      fs.writeFileSync(inspectionRecordPath, JSON.stringify(inspectionRecordData, null, 2));

      console.log(`CSVデータを保存しました: ${csvFilePath}`);

      res.status(200).json({
        message: 'データが正常に保存されました',
        fileName: outputFileName
      });

    } catch (error) {
      console.error('データ保存エラー:', error);
      res.status(500).json({ error: 'データの保存に失敗しました' });
    }
  });

  app.get('/api/inspection-files', async (req, res) => {
    try {
      if (!fs.existsSync(INSPECTION_FILES_DIR)) {
        fs.mkdirSync(INSPECTION_FILES_DIR, { recursive: true });
        return res.status(200).json({ files: [] });
      }

      const files = await promisify(fs.readdir)(INSPECTION_FILES_DIR);
      const fileDetails = await Promise.all(
        files
          .filter(file => file.endsWith('.csv'))
          .map(async (file) => {
            const stats = await promisify(fs.stat)(path.join(INSPECTION_FILES_DIR, file));
            return {
              name: file,
              size: stats.size,
              modified: stats.mtime,
              modifiedTime: new Date(stats.mtime).getTime()
            };
          })
      );

      fileDetails.sort((a, b) => b.modifiedTime - a.modifiedTime);

      res.json({ 
        files: fileDetails,
        latestFile: fileDetails.length > 0 ? fileDetails[0].name : null 
      });
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
      res.status(500).json({ error: 'ファイル一覧の取得に失敗しました' });
    }
  });


  function getSampleInspectionData() {
    const headers = [
      'メーカー',
      '機種',
      'エンジン型式',
      '部位',
      '装置',
      '手順',
      '確認箇所',
      '判断基準',
      '確認要領',
      '測定等記録',
      '図形記録'
    ].join(',');

    const dataRows = [
      ['堀川工機', 'MC300', 'ボルボ', 'エンジン', '本体', '', 'エンジンヘッドカバー、ターボ', 'オイル、燃料漏れ', 'オイル等滲み・垂れ跡が無', '', ''].join(','),
      ['堀川工機', 'MC300', 'ボルボ', 'エンジン', '本体', '', '排気及び吸気', '排気ガス色及びガス漏れ等の点検（マフラー等）', 'ほぼ透明の薄紫', '', ''].join(','),
      ['堀川工機', 'MC500', 'ボルボ', 'エンジン', '冷却系統', '', 'ラジエター', '水漏れ、汚れ', '漏れ・汚れ無し', '', ''].join(','),
      ['堀川工機', 'MC500', 'ボルボ', 'エンジン', '油圧系統', '', 'ホース・配管', '油漏れ、亀裂', '亀裂・油漏れ無し', '', ''].join(','),
      ['クボタ', 'KT450', 'クボタV3300', 'エンジン', '冷却系統', '', 'ラジエター', '水漏れ、汚れ', '漏れ・汚れ無し', '', ''].join(','),
      ['クボタ', 'KT450', 'クボタV3300', 'エンジン', '油圧系統', '', 'ホース・配管', '油漏れ、亀裂', '亀裂・油漏れ無し', '', ''].join(','),
      ['クボタ', 'KT580', 'クボタV3800', '走行装置', 'ブレーキ', '', 'ブレーキペダル', '踏み代、効き', '規定の踏み代で確実に効く', '', ''].join(','),
      ['クボタ', 'KT580', 'クボタV3800', '走行装置', 'クラッチ', '', 'クラッチペダル', '遊び、切れ', '規定の遊びがあり確実に切れる', '', ''].join(','),
      ['ヤンマー', 'YT220', 'ヤンマー4TNV', '走行装置', 'ブレーキ', '', 'ブレーキペダル', '踏み代、効き', '規定の踏み代で確実に効く', '', ''].join(','),
      ['ヤンマー', 'YT220', 'ヤンマー4TNV', '走行装置', 'クラッチ', '', 'クラッチペダル', '遊び、切れ', '規定の遊びがあり確実に切れる', '', ''].join(','),
      ['ヤンマー', 'YT330', 'ヤンマー4TNV', '電装品', 'バッテリー', '', '端子', '緩み、腐食', '緩み・腐食無し', '', ''].join(','),
      ['ヤンマー', 'YT330', 'ヤンマー4TNV', '電装品', 'ライト', '', 'ヘッドライト', '点灯確認', '正常に点灯する', '', ''].join(',')
    ];

    return [headers, ...dataRows].join('\n');
  }

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }
    if (!req.user || req.user.is_admin !== 1) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const userId = parseInt(req.params.id);
      const { username, password, isAdmin } = req.body;

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "ユーザーが見つかりません" });
      }

      if (username !== existingUser.username) {
        const duplicateUser = await storage.getUserByUsername(username);
        if (duplicateUser) {
          return res.status(400).json({ error: "ユーザー名が既に存在します" });
        }
      }

      const updateData: Partial<typeof existingUser> = {
        username,
        isAdmin: isAdmin || false
      };

      if (password) {
        updateData.password = await hashPassword(password);
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        isAdmin: updatedUser.isAdmin
      });
    } catch (error) {
      console.error("ユーザー更新エラー:", error);
      res.status(500).json({ error: "ユーザーの更新に失敗しました" });
    }
  });

  app.get("/api/inspection-data", (req, res) => {
    fs.promises.readFile(path.join(process.cwd(), 'attached_assets', '仕業点検マスタ.csv'), 'utf8')
      .then(data => {
        res.set('Content-Type', 'text/csv');
        res.send(data);
      })
      .catch(error => {
        console.error("CSVファイル読み込みエラー:", error);
        res.status(404).json({ error: "CSVファイルが見つかりません" });
      });
  });


  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }
    if (!req.user || req.user.is_admin !== 1) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const userId = parseInt(req.params.id);

      if (userId === req.user.id) {
        return res.status(400).json({ error: "自分自身は削除できません" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "ユーザーが見つかりません" });
      }

      await storage.deleteUser(userId);
      res.status(200).json({ message: "ユーザーを削除しました" });
    } catch (error) {
      console.error("ユーザー削除エラー:", error);
      res.status(500).json({ error: "ユーザーの削除に失敗しました" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}