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
  // 最新の仕業点検マスタファイルを取得する関数
  async function getLatestInspectionMasterFile() {
    const inspectionDir = path.join(process.cwd(), 'attached_assets/inspection');
    const files = await fs.promises.readdir(inspectionDir);
    const masterFiles = files.filter(file => file.includes('仕業点検マスタ') && file.endsWith('.csv'));

    if (masterFiles.length > 0) {
      // ファイル名でソートして最新のものを取得
      masterFiles.sort();
      return masterFiles[masterFiles.length - 1];
    }
    return null;
  }

  app.get('/api/inspection-items', async (req, res) => {
    try {
      // パラメータからファイル名を取得
      const fileName = req.query.file as string | undefined;

      // CSVファイルのパスを決定
      const inspectionDir = path.join(process.cwd(), 'attached_assets/inspection');
      let csvFilePath;

      if (fileName) {
        // 指定されたファイル名を使用
        csvFilePath = path.join(inspectionDir, fileName);
        // ファイルが存在するか確認
        if (!fs.existsSync(csvFilePath)) {
          return res.status(404).json({ error: '指定されたファイルが見つかりません' });
        }
      } else {
        // 最新の仕業点検マスタファイルを使用
        const latestFile = await getLatestInspectionMasterFile();
        if (latestFile) {
          csvFilePath = path.join(inspectionDir, latestFile);
          console.log('使用するCSVファイル:', csvFilePath);
        } else {
          return res.status(404).json({ error: '点検項目マスタファイルが見つかりません' });
        }
      }

      const fileContent = await fs.promises.readFile(csvFilePath, 'utf8');
      
      // ファイル形式の判定
      const isCSV = fileContent.trim().startsWith('製造メーカー') || 
                    fileContent.trim().startsWith('メーカー');

      if (!isCSV) {
        try {
          const jsonData = JSON.parse(fileContent);
          return res.json(jsonData);
        } catch (error) {
          console.error('JSONパースエラー:', error);
        }
      }

      // 不要な文字を削除
      const cleanedContent = fileContent
        .replace(/\uFEFF/g, '') // BOMを削除
        .replace(/[\r\n]+/g, '\n') // 改行コードを統一
        .trim();

      const results = Papa.parse(cleanedContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value?.trim() || '',
        delimiter: ',',
        encoding: 'UTF-8',
      });

      console.log('点検項目データ取得:', results.data.length, '件');

      const items = [];
      const headerMapping = {
        '製造メーカー': 'manufacturer',
        '機種': 'model',
        'エンジン型式': 'engineType',
        '部位': 'category',
        '装置': 'equipment',
        '確認箇所': 'item',
        '判断基準': 'criteria',
        '確認要領': 'method',
        '測定等記録': 'measurementRecord',
        '図形記録': 'diagramRecord',
        '備考': 'remark'
      };

      results.data.forEach((row, index) => {
        if (!row || Object.keys(row).length === 0) return;

        const item: any = { id: index + 1 };
        Object.entries(row).forEach(([key, value]) => {
          if (!key) return;
          const mappedKey = headerMapping[key] || key;
          if (value && typeof value === 'string') {
            item[mappedKey] = value.trim();
          } else {
            item[mappedKey] = value || '';
          }
        });

        // 必須フィールドが存在する場合のみ追加
        if (item.manufacturer && item.model && item.category && item.equipment && item.item) {
          items.push(item);
        }
      });
      res.json(items);
    } catch (error) {
      console.error('Error loading inspection items:', error);
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'ファイルが見つかりません' });
      } else {
        res.status(500).json({ error: 'データの読み込みに失敗しました' });
      }
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
        'diagramRecord': '図形記録',
        'result': 'result',          // 点検結果を保存
        'measuredValue': 'measuredValue', // 実測値を保存
        'notes': 'notes'             // 備考を保存
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

        // 新しいフィールドを追加
        const additionalFields = ['result', 'measuredValue', 'notes'];
        additionalFields.forEach(field => {
          if (!originalHeaders.includes(field)) {
            originalHeaders.push(field);
            console.log('新しいフィールドを追加しました:', field);
          }
        });

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

  // 利用可能なCSVファイル一覧を取得するエンドポイント
  app.get('/api/inspection-files', async (req, res) => {
    try {
      const inspectionDir = path.join(process.cwd(), 'attached_assets/inspection');
      
      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(inspectionDir)) {
        fs.mkdirSync(inspectionDir, { recursive: true });
      }

      const files = await fs.promises.readdir(inspectionDir);
      const csvFiles = files.filter(file => file.endsWith('.csv'));

      const fileStats = await Promise.all(
        csvFiles.map(async (file) => {
          const filePath = path.join(inspectionDir, file);
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            modified: stats.mtime.toISOString(),
          };
        })
      );

      // 最終更新日時順にソート
      fileStats.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

      res.json(fileStats);
    } catch (error) {
      console.error('Error reading attached_assets directory:', error);
      res.status(500).json({ error: 'ファイル一覧の取得に失敗しました' });
    }
  });

  app.get('/api/files/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    const filePath = path.join(process.cwd(), 'attached_assets', fileId);
    try {
      if (await fs.promises.access(filePath, fs.constants.F_OK).then(() => true).catch(() => false)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({error: 'File not found'});
      }
    } catch (err) {
      console.error('Error sending file:', err);
      res.status(500).json({ error: 'ファイルの送信に失敗しました' });
    }
  });

  app.post('/api/files', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const multer = require('multer');
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 } 
    }).single('file');

    upload(req, res, async function(err) {
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

        const fileName = req.file.originalname;
        const csvFilePath = path.join(assetsDir, fileName);

        await fs.promises.writeFile(csvFilePath, req.file.buffer);

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

  // 技術支援データ処理API
  app.post('/api/tech-support/upload', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const multer = require('multer');
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 } // 50MB制限
    }).single('file');

    upload(req, res, async function(err) {
      if (err) {
        console.error('ファイルアップロードエラー:', err);
        return res.status(500).json({ error: 'ファイルアップロードに失敗しました' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'ファイルが提供されていません' });
      }

      try {
        const dataDir = path.join(process.cwd(), 'attached_assets/data');
        const imagesDir = path.join(process.cwd(), 'attached_assets/images');

        // ディレクトリの存在確認と作成
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        const originalFilename = req.file.originalname;
        const timestamp = Date.now();
        const fileExtension = path.extname(originalFilename).toLowerCase();

        // ファイル形式の確認
        if (fileExtension !== '.pptx' && fileExtension !== '.xlsx' && fileExtension !== '.xls') {
          return res.status(400).json({ error: '対応していないファイル形式です。PPTX、XLSXまたはXLSファイルをアップロードしてください。' });
        }

        // 一時ファイルの保存
        const tempFilePath = path.join(process.cwd(), 'attached_assets', `temp_${timestamp}${fileExtension}`);
        fs.writeFileSync(tempFilePath, req.file.buffer);

        // ファイルの処理（PPTXまたはExcel）
        let extractionResult;
        if (fileExtension === '.pptx') {
          // PPTXファイルの処理
          const { extractPptxContent } = require('../server/file-utils'); // 後で実装
          extractionResult = await extractPptxContent(tempFilePath, imagesDir, timestamp);
        } else {
          // Excelファイルの処理
          const { extractExcelContent } = require('../server/file-utils'); // 後で実装
          extractionResult = await extractExcelContent(tempFilePath, imagesDir, timestamp);
        }

        // JSONデータの保存
        const jsonFilePath = path.join(dataDir, `data_${timestamp}.json`);
        fs.writeFileSync(jsonFilePath, JSON.stringify(extractionResult.textData, null, 2));

        // 一時ファイルの削除
        fs.unlinkSync(tempFilePath);

        res.status(200).json({ 
          message: 'ファイルが正常に処理されました',
          fileName: originalFilename,
          timestamp: timestamp,
          textDataPath: `data_${timestamp}.json`,
          imageCount: extractionResult.imageCount
        });
      } catch (error) {
        console.error('ファイル処理エラー:', error);
        res.status(500).json({ error: 'ファイルの処理に失敗しました', details: error.message });
      }
    });
  });

  // 処理済みファイル一覧を取得するAPI
  app.get('/api/tech-support/files', async (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'attached_assets/data');
      if (!fs.existsSync(dataDir)) {
        return res.json({ files: [] });
      }

      const files = await fs.promises.readdir(dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const fileStats = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(dataDir, file);
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            modified: stats.mtime.toISOString(),
          };
        })
      );

      // 最終更新日時順にソート
      fileStats.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

      res.json({ files: fileStats });
    } catch (error) {
      console.error('処理済みファイル一覧取得エラー:', error);
      res.status(500).json({ error: 'ファイル一覧の取得に失敗しました' });
    }
  });

  // 処理済みのJSONデータを取得するAPI
  app.get('/api/tech-support/data/:fileName', async (req, res) => {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(process.cwd(), 'attached_assets/data', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'ファイルが見つかりません' });
      }

      const data = await fs.promises.readFile(filePath, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      console.error('データ取得エラー:', error);
      res.status(500).json({ error: 'データの取得に失敗しました' });
    }
  });

  // 処理済みの画像を取得するAPI
  app.get('/api/tech-support/images/:fileName', async (req, res) => {
    try {
      const fileName = req.params.fileName;
      const filePath = path.join(process.cwd(), 'attached_assets/images', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '画像が見つかりません' });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error('画像取得エラー:', error);
      res.status(500).json({ error: '画像の取得に失敗しました' });
    }
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

  // 測定記録を取得するエンドポイント
  app.get('/api/measurement-records', async (req, res) => {
    try {
      const measurementFilePath = path.join(process.cwd(), 'attached_assets/測定基準値_20250313_record.json');
      const data = await fs.promises.readFile(measurementFilePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      console.error('測定記録の読み込みエラー:', error);
      res.status(500).json({ error: '測定記録の読み込みに失敗しました' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}