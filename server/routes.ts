import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { promisify } from 'util';
import express from 'express';

const INSPECTION_FILES_DIR = path.join(process.cwd(), 'attached_assets');
const inspectionItemsDir = INSPECTION_FILES_DIR;

async function readCsvFile(filePath: string) {
  const fileContent = await fs.promises.readFile(filePath, 'utf8');
  return Papa.parse(fileContent, { header: true }).data;
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);
  const router = express.Router();

  // CSVファイルを読み込む関数
  function readCsvFileSync(filePath: string): any[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return Papa.parse(data, { header: true }).data;
  }

  // 製造メーカー一覧を取得
  router.get('/inspection/table/manufacturers', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets/inspection/table/manufacturers.csv');
      const data = await readCsvFile(filePath);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to read manufacturers data' });
    }
  });

  // 機種一覧を取得
  router.get('/inspection/table/models', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets/inspection/table/models.csv');
      const data = await readCsvFile(filePath);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to read models data' });
    }
  });

  // 点検項目一覧を取得
  router.get('/inspection/table/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
      const filePath = path.join(process.cwd(), `attached_assets/inspection/table/${tableName}.csv`);
      const data = await readCsvFile(filePath);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'テーブルデータの読み込みに失敗しました' });
    }
  });

  router.post('/inspection/table/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
      const { data } = req.body;
      const filePath = path.join(process.cwd(), `attached_assets/inspection/table/${tableName}.csv`);
      const csvContent = Papa.unparse(data);
      await fs.promises.writeFile(filePath, csvContent);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'テーブルデータの保存に失敗しました' });
    }
  });


  router.get('/inspection/table/:type', async (req, res) => {
    try {
      const type = req.params.type;
      const baseDir = path.join(process.cwd(), 'attached_assets/inspection/table');

      let filePath;
      switch (type) {
        case 'manufacturers':
          filePath = path.join(baseDir, 'manufacturers.csv');
          break;
        case 'models':
          filePath = path.join(baseDir, 'models.csv');
          break;
        case 'inspection_items':
          filePath = path.join(baseDir, 'inspection_items.csv');
          break;
        default:
          return res.status(400).json({ error: '無効なタイプです' });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'ファイルが見つかりません' });
      }

      const content = await fs.promises.readFile(filePath, 'utf8');
      const results = Papa.parse(content, { header: true });
      res.json(results.data);
    } catch (error) {
      console.error('データ取得エラー:', error);
      res.status(500).json({ error: 'データの取得に失敗しました' });
    }
  });

  app.use('/api', router);


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

  // Manufacturers endpoints
  app.get('/api/manufacturers', async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      res.status(500).json({ error: 'メーカー一覧の取得に失敗しました' });
    }
  });

  app.post('/api/manufacturers', async (req, res) => {
    try {
      const { name } = req.body;

      // CSVファイルからデータを読み込み
      const filePath = path.join(process.cwd(), 'attached_assets/inspection/table/manufacturers.csv');
      let manufacturers = [];
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        manufacturers = Papa.parse(content, { header: true }).data;
      }

      // 重複チェック
      if (manufacturers.some(m => m.name === name)) {
        return res.status(400).json({ error: '既に登録されている製造メーカーです' });
      }

      // 新しいIDを生成
      const existingIds = manufacturers
        .map(m => parseInt(m.id))
        .filter(id => !isNaN(id));

      const newId = existingIds.length > 0 ? 
        Math.max(...existingIds) + 1 : 1;

      // 新しいメーカーを追加
      const newManufacturer = { id: newId, name };
      manufacturers.push(newManufacturer);

      // CSVファイルに保存
      const csv = Papa.unparse(manufacturers);
      await fs.promises.writeFile(filePath, csv);

      res.status(201).json(newManufacturer);
    } catch (error) {
      console.error('Error creating manufacturer:', error);
      res.status(500).json({ error: 'メーカーの追加に失敗しました' });
    }
  });

  app.delete('/api/manufacturers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteManufacturer(id);
      res.status(200).json({ message: 'メーカーを削除しました' });
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      res.status(500).json({ error: 'メーカーの削除に失敗しました' });
    }
  });

  // Models endpoints
  app.get('/api/models', async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: '機種一覧の取得に失敗しました' });
    }
  });

  app.post('/api/models', async (req, res) => {
    try {
      const { name, code, manufacturerId } = req.body;
      if (!name || !manufacturerId) {
        return res.status(400).json({ error: '機種名と製造メーカーIDは必須です' });
      }

      const model = await storage.createModel({ 
        name, 
        code: code || '', 
        manufacturerId: parseInt(manufacturerId)
      });

      res.status(201).json(model);
    } catch (error) {
      console.error('Error creating model:', error);
      res.status(500).json({ error: '機種の追加に失敗しました' });
    }
  });

  app.delete('/api/models/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteModel(id);
      res.status(200).json({ message: '機種を削除しました' });
    } catch (error) {
      console.error('Error deleting model:', error);
      res.status(500).json({ error: '機種の削除に失敗しました' });
    }
  });

  // Machine numbers endpoints
  app.get('/api/machineNumbers', async (req, res) => {
    try {
      const machineNumbers = await storage.getMachineNumbers();
      res.json(machineNumbers);
    } catch (error) {
      console.error('Error fetching machine numbers:', error);
      res.status(500).json({ error: '機械番号一覧の取得に失敗しました' });
    }
  });

  app.post('/api/machineNumbers', async (req, res) => {
    try {
      const { number, modelId } = req.body;
      if (!number || !modelId) {
        return res.status(400).json({ error: '機械番号と機種IDは必須です' });
      }
      const machineNumber = await storage.createMachineNumber({ 
        number, 
        model_id: modelId,
        manufacturer_id: 1 
      });
      res.status(201).json(machineNumber);
    } catch (error) {
      console.error('Error creating machine number:', error);
      res.status(500).json({ error: '機械番号の追加に失敗しました' });
    }
  });

  app.delete('/api/machineNumbers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMachineNumber(id);
      res.status(200).json({ message: '機械番号を削除しました' });
    } catch (error) {
      console.error('Error deleting machine number:', error);
      res.status(500).json({ error: '機械番号の削除に失敗しました' });
    }
  });

  // 4つのテーブルのエンドポイント
  app.get('/api/inspection/table/:tableName', async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const targetDir = path.join(process.cwd(), 'attached_assets/inspection/table');
      const filePath = path.join(targetDir, `${tableName}.csv`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `${tableName}テーブルが見つかりません` });
      }

      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const cleanContent = fileContent.replace(/^\uFEFF/, ''); // BOMを除去

      const results = Papa.parse(cleanContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value?.trim() || ''
      });

      console.log(`${tableName}テーブルのデータを読み込みました:`, results.data.length, '件');
      res.json(results.data);
    } catch (error) {
      console.error(`テーブル読み込みエラー:`, error);
      res.status(500).json({ error: 'テーブルの読み込みに失敗しました' });
    }
  });

  app.get('/api/machineNumbers/:number', async (req, res) => {
    try {
      const machineNumber = req.params.number;
      const machineData = await storage.getMachineNumberByNumber(machineNumber);

      if (!machineData) {
        return res.status(404).json({ error: '機械番号が見つかりません' });
      }

      // 関連する点検項目を取得
      const inspectionItemsPath = path.join(process.cwd(), 'attached_assets/inspection/table/inspection_items.csv');
      if (!fs.existsSync(inspectionItemsPath)) {
        return res.status(404).json({ error: '点検項目マスタが見つかりません' });
      }

      const inspectionContent = await fs.promises.readFile(inspectionItemsPath, 'utf8');
      const inspectionItems = Papa.parse(inspectionContent, { header: true }).data;

      // 機械番号に紐づく機種の点検項目をフィルタリング
      const filteredItems = inspectionItems.filter((item: any) => 
        String(item.model_id) === String(machineData.model_id)
      );

      res.json({
        ...machineData,
        inspection_items: filteredItems
      });
    } catch (error) {
      console.error('Error fetching machine number:', error);
      if (error instanceof Error) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: '機械情報の取得に失敗しました' });
      }
    }
  });

  app.get('/api/inspection-items', async (req, res) => {
    try {
      const manufacturer = req.query.manufacturer as string;
      const model = req.query.model as string;
      const filePath = path.join(process.cwd(), 'attached_assets/inspection/table/inspection_items.csv');

      // ディレクトリとファイルが存在しない場合は作成
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      if (!fs.existsSync(filePath)) {
        // 初期データを作成
        const initialData = 'model_id,category,equipment,item,criteria,method\n1,エンジン,本体,エンジン状態,正常,目視確認';
        fs.writeFileSync(filePath, initialData, 'utf-8');
      }

      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value?.trim() || ''
      });

      // 機種に紐づく点検項目をフィルタリング
      const filteredItems = results.data.filter((item: any) => 
        item.model === model || item.機種 === model
      );

      res.json(filteredItems);
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

  app.post('/api/save-inspection-data', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    try {
      const { data, fileName, inspectionRecord } = req.body;

      if (!data) {
        return res.status(400).json({ error: '保存するデータがありません' });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const assetsDir = path.join(process.cwd(), 'attached_assets');
      const inspectionDir = path.join(assetsDir, 'inspection');

      // Create directory if it doesn't exist
      if (!fs.existsSync(inspectionDir)) {
        fs.mkdirSync(inspectionDir, { recursive: true });
      }

      // Generate file name
      const outputFileName = fileName || 'inspection_data.csv';
      const outputFilePath = path.join(inspectionDir, outputFileName);

      // Save data
      const csvData = Papa.unparse(data, {
        header: true,
        delimiter: ',',
        quoteChar: '"'
      });
      await fs.promises.writeFile(outputFilePath, csvData, 'utf8');

      console.log('ファイル保存完了:', outputFileName);

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
      const searchDir = path.join(process.cwd(), 'attached_assets/inspection');

      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(searchDir)) {
        fs.mkdirSync(searchDir, { recursive: true });
      }

      const files = await fs.promises.readdir(searchDir);
      const pastFiles = files.filter(file => file.endsWith('.csv'));

      const fileStats = await Promise.all(
        pastFiles.map(async (file) => {
          const filePath = path.join(searchDir, file);
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

  app.get("/api/inspection-data", async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', '仕業点検マスタ.csv');
      const data = await fs.promises.readFile(filePath, 'utf8');

      // BOMを除去
      const cleanData = data.replace(/^\uFEFF/, '');

      // CSVパース
      const results = Papa.parse(cleanData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value?.trim() || '',
        encoding: 'UTF-8'
      });

      if (results.errors && results.errors.length > 0) {
        console.warn('CSVパース警告:', results.errors);
      }

      res.json(results.data);
    } catch (error) {
      console.error("CSVファイル読み込みエラー:", error);
      res.status(404).json({ error: "CSVファイルが見つかりません" });
    }
  });

  // 技術支援データ処理API
  app.post('/api/tech-support/upload', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const multer = require('multer');
    const upload = multer({ 
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 } 
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
          const { extractPptxContent } = require('../server/file-utils'); 
          extractionResult = await extractPptxContent(tempFilePath, imagesDir, timestamp);
        } else {
          // Excelファイルの処理
          const { extractExcelContent } = require('../server/file-utils'); 
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
    } catch(error) {
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
      ['堀川工機', 'MC300', 'ボルボ', 'エンジン', '本体','', 'エンジンヘッドカバー、ターボ', 'オイル、燃料漏れ', 'オイル等滲み・垂れ跡が無', '', ''].join(','),
      ['堀川工機', 'MC300', 'ボルボ', 'エンジン', '本体', '', '排気及び吸気', '排気ガス色及びガス漏れ等の点検（マフラー等）', 'ほぼ透明の薄紫', '', ''].join(','),
      ['堀川工機', 'MC500', 'ボルボ', 'エンジン', '冷却系統', '', 'ラジエター', '水漏れ、汚れ', '漏れ・汚れ無し', '', ''].join(','),
      ['堀川工機', 'MC500', 'ボルボ', 'ボルボ', 'エンジン', '油圧系統', '', 'ホース・配管', '油漏れ、亀裂', '亀裂・油漏れ無し', '', ''].join(','),
      ['クボタ', 'KT450', 'クボタV3300', 'エンジン', '冷却系統', '', 'ラジエター', '水漏れ、汚れ', '漏れ・汚れ無し', '', ''].join(','),
      ['クボタ', 'KT450', 'クボタV3300', 'エンジン', '油圧系統', '', 'ホース・配管', '油漏れ、亀裂','亀裂・油漏れ無し', '', ''].join(','),
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
  // 車種一覧を取得するエンドポイント
  app.get('/api/vehicle-models', async (req, res) => {
    try {
      const inspectionDir = path.join(process.cwd(), 'attached_assets/inspection');
      const files = await fs.promises.readdir(inspectionDir);
      const masterFiles = files.filter(file => file.includes('仕業点検マスタ') && file.endsWith('.csv'));

      if (masterFiles.length === 0) {
        return res.status(404).json({ error: '点検マスタファイルが見つかりません' });
      }

      // 最新のファイルを取得
      masterFiles.sort();
      const latestFile = masterFiles[masterFiles.length - 1];
      const filePath = path.join(inspectionDir, latestFile);

      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });

      // 車種の一覧を抽出（重複を除去）
      const models = [...new Set(results.data
        .map((row: any) => row['機種'] || row.model)
        .filter(Boolean)
      )].sort();

      res.json(models);
    } catch (error) {
      console.error('車種一覧取得エラー:', error);
      res.status(500).json({ error: '車種一覧の取得に失敗しました' });
    }
  });

  app.post('/api/measurement-standards', async (req, res) => {
    try {
      const { standard } = req.body;
      const filePath = path.join(process.cwd(), 'attached_assets/Reference value/measurement_standards.json');

      let standards = { measurementStandards: [] };
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        standards = JSON.parse(content);
      }

      const existingIndex = standards.measurementStandards.findIndex(s => 
        s.category === standard.category && 
        s.equipment === standard.equipment && 
        s.item === standard.item
      );

      if (existingIndex >= 0) {
        standards.measurementStandards[existingIndex] = standard;
      } else {
        standards.measurementStandards.push(standard);
      }

      await fs.promises.writeFile(filePath, JSON.stringify(standards, null, 2));
      res.json({ message: '基準値を保存しました' });
    } catch (error) {
      console.error('基準値保存エラー:', error);
      res.status(500).json({ error: '基準値の保存に失敗しました' });
    }
  });

  // 基準値テーブルを取得
  app.get('/api/measurement-standards', async (req, res) => {
    try {
      const tablePath = path.join(process.cwd(), 'attached_assets/inspection/table/measurement_standards.csv');
      if (!fs.existsSync(tablePath)) {
        return res.json({ standards: [] });
      }
      const fileContent = await fs.promises.readFile(tablePath, 'utf8');
      const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true
      });
      res.json({ standards: results.data });
    } catch (error) {
      console.error('基準値取得エラー:', error);
      res.status(500).json({ error: '基準値の取得に失敗しました' });
    }
  });

  // 基準値を保存
  app.post('/api/measurement-standards', async (req, res) => {
    try {
      const { standard } = req.body;
      const tablePath = path.join(process.cwd(), 'attached_assets/inspection/table/measurement_standards.csv');

      // 既存のデータを読み込むか、新規作成
      let standards = [];
      if (fs.existsSync(tablePath)) {
        const content = await fs.promises.readFile(tablePath, 'utf8');
        standards = Papa.parse(content, { header: true }).data;
      }

      // inspection_item_idで既存の項目を検索
      const existingIndex = standards.findIndex(s => 
        s.inspection_item_id === standard.inspection_item_id
      );

      if (existingIndex >= 0) {
        // 既存の項目を更新
        standards[existingIndex] = standard;
      } else {
        // 新規追加
        standards.push(standard);
      }

      // CSVとして保存
      const csv = Papa.unparse(standards);
      await fs.promises.writeFile(tablePath, csv);

      res.json({ message: '基準値を保存しました' });
    } catch (error) {
      console.error('基準値保存エラー:', error);
      res.status(500).json({ error: '基準値の保存に失敗しました' });
    }
  });

  app.get('/api/measurement-records', async (req, res) => {
    try {
      const measurementDir = path.join(process.cwd(), 'attached_assets/Measurement Standard Value');
      const measurementFilePath = path.join(measurementDir, 'measurement_standards_record.json');

      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(measurementDir)) {
        fs.mkdirSync(measurementDir, { recursive: true });
      }

      // ファイルが存在しない場合は空の配列で初期化
      if (!fs.existsSync(measurementFilePath)) {
        await fs.promises.writeFile(measurementFilePath, JSON.stringify({ measurementStandards: [] }), 'utf-8');
      }

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

