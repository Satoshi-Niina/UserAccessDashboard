import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse'; // Added import for Papa Parse

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // ユーザー一覧の取得 (管理者のみ)
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

  // 新規ユーザーの登録 (管理者のみ)
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }
    if (!req.user || req.user.is_admin !== 1) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const { username, password, isAdmin } = req.body;

      // ユーザー名の重複チェック
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "ユーザー名が既に存在します" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        is_admin: isAdmin ? 1 : 0  // SQLiteでは真偽値を1/0で表現
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

// 仕業点検項目のCSVを返すAPI
app.get('/api/inspection-items', (req, res) => {
  console.log('API: /api/inspection-items が呼び出されました');

  // キャッシュ制御ヘッダーを設定
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    // 現在の作業ディレクトリと設定
    const currentDir = process.cwd();
    const assetsDir = path.join(currentDir, 'attached_assets');
    
    // ディレクトリが存在しない場合はサンプルデータを返す
    if (!fs.existsSync(assetsDir)) {
      console.error('attached_assetsディレクトリが存在しません');
      return res.status(200).send(getSampleInspectionData());
    }

    // CSVファイルパス
    const csvFilePath = path.join(assetsDir, '仕業点検マスタ.csv');

    // CSVファイルが存在し、かつ空でないか確認
    if (fs.existsSync(csvFilePath)) {
      console.log('CSVファイルが見つかりました:', csvFilePath);

      // CSVファイル読み込み
      const csvData = fs.readFileSync(csvFilePath, 'utf8');

      if (csvData && csvData.trim().length > 0 && !csvData.includes('404: Not Found')) {
        console.log(`CSVデータ読み込み成功 (${csvData.length} バイト)`);
        
        // 改行で分割して実際の行数をカウント（空行を除外）
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        console.log(`CSVの有効行数: ${lines.length}`);

        // ヘッダー行を確認
        const headerLine = lines.length > 0 ? lines[0] : '';
        
        // ヘッダーが空の場合、ヘッダーを追加
        if (!headerLine.trim()) {
          // 標準ヘッダーの定義
          const standardHeader = '製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録';
          const newCsvData = standardHeader + '\n' + csvData.trimStart();
          console.log('空のヘッダーを検出、標準ヘッダーを追加しました');
          
          // Content-Typeを明示的に設定
          res.set('Content-Type', 'text/csv; charset=utf-8');
          return res.status(200).send(newCsvData);
        }

        console.log(`ヘッダー: ${headerLine}`);
        
        // Content-Typeを明示的に設定
        res.set('Content-Type', 'text/csv; charset=utf-8');
        return res.status(200).send(csvData);
      } else {
        console.warn('CSVファイルが空または不正なデータ形式です');
      }
    } else {
      console.warn('CSVファイルが見つかりません:', csvFilePath);
    }

    // CSVが存在しないか無効な場合はサンプルデータを返す
    res.set('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(getSampleInspectionData());

  } catch (err) {
    console.error('CSVファイル処理エラー:', err);
    // エラーが発生した場合もサンプルデータを返す
    res.set('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(getSampleInspectionData());
  }
});

// 仕業点検項目CSVのアップロードAPI
app.post('/api/upload-inspection-items', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  // マルチパートフォームデータを処理するミドルウェア
  const multer = require('multer');
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB制限
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
      // attached_assetsディレクトリのチェックと作成
      const assetsDir = path.join(process.cwd(), 'attached_assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // CSVファイルパス
      const csvFilePath = path.join(assetsDir, '仕業点検マスタ.csv');

      // ファイルを保存
      fs.writeFileSync(csvFilePath, req.file.buffer);

      console.log(`CSVファイルを保存しました: ${csvFilePath} (${req.file.buffer.length} バイト)`);

      res.status(200).json({ 
        message: 'ファイルが正常にアップロードされました',
        fileName: '仕業点検マスタ.csv',
        size: req.file.buffer.length
      });
    } catch (error) {
      console.error('ファイル保存エラー:', error);
      res.status(500).json({ error: 'ファイルの保存に失敗しました' });
    }
  });
});

// 仕業点検のサンプルデータを生成する関数
function getSampleInspectionData() {
  // ヘッダー行
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

  // サンプルデータ行
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

  // ユーザー情報の更新 (管理者のみ)
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

      // ユーザーの存在確認
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "ユーザーが見つかりません" });
      }

      // ユーザー名の重複チェック（自分以外）
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

  // CSVファイルの提供 (この部分は変更なし)
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


  // ユーザー削除 (管理者のみ)
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "認証が必要です" });
    }
    if (!req.user || req.user.is_admin !== 1) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const userId = parseInt(req.params.id);

      // 自分自身は削除できない
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