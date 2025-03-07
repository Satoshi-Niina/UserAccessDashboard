import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse'; // Added import for Papa Parse
import { promisify } from 'util'; // Added for promisified fs functions

// CSVファイルの保存先ディレクトリ
const INSPECTION_FILES_DIR = path.join(process.cwd(), 'attached_assets');

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

// 仕業点検項目のCSVを返すAPI - Modified to handle file selection and auto-detect latest file
app.get('/api/inspection-items', async (req, res) => {
  console.log('API: /api/inspection-items が呼び出されました');

  // ファイル名が指定されていない場合や "latest" の場合は最新のファイルを取得
  let requestedFile = (req.query.file || req.query.filename) as string;
  if (!requestedFile || requestedFile === 'latest') {
    try {
      // ディレクトリ内の全CSVファイルを取得
      if (fs.existsSync(INSPECTION_FILES_DIR)) {
        const files = await promisify(fs.readdir)(INSPECTION_FILES_DIR);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        if (csvFiles.length > 0) {
          // 各ファイルの更新日時を取得してソート
          const fileStats = await Promise.all(
            csvFiles.map(async file => {
              const stats = await promisify(fs.stat)(path.join(INSPECTION_FILES_DIR, file));
              return { 
                name: file, 
                mtime: stats.mtime.getTime() 
              };
            })
          );

          // 最新のファイルを特定
          fileStats.sort((a, b) => b.mtime - a.mtime);
          requestedFile = fileStats[0]?.name || '仕業点検マスタ.csv';
        } else {
          requestedFile = '仕業点検マスタ.csv';
        }
      } else {
        requestedFile = '仕業点検マスタ.csv';
      }
    } catch (error) {
      console.error('最新ファイル特定エラー:', error);
      requestedFile = '仕業点検マスタ.csv';
    }
  }

  console.log('リクエストされたファイル:', requestedFile);

  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const filePath = path.join(INSPECTION_FILES_DIR, requestedFile);

    if (!fs.existsSync(filePath)) {
      console.warn('指定されたCSVファイルが見つかりません:', filePath);

      // attached_assetsディレクトリ内のCSVファイルを探索
      const files = await promisify(fs.readdir)(INSPECTION_FILES_DIR);
      const csvFiles = files.filter(file => file.endsWith('.csv'));

      if (csvFiles.length > 0) {
        // 最新のCSVファイルを使用
        const fileStats = await Promise.all(
          csvFiles.map(async file => {
            const stats = await promisify(fs.stat)(path.join(INSPECTION_FILES_DIR, file));
            return { 
              name: file, 
              mtime: stats.mtime.getTime() 
            };
          })
        );

        fileStats.sort((a, b) => b.mtime - a.mtime);
        const latestFile = fileStats[0].name;
        const latestFilePath = path.join(INSPECTION_FILES_DIR, latestFile);

        console.log('最新のCSVファイルを使用します:', latestFilePath);
        const csvData = fs.readFileSync(latestFilePath, 'utf8');
        res.set('Content-Type', 'text/csv; charset=utf-8');
        return res.status(200).send(csvData);
      } else {
        return res.status(404).json({ error: 'CSVファイルが見つかりません' });
      }
    }

    const fileContent = await promisify(fs.readFile)(filePath, 'utf8');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('点検項目取得エラー:', error);
    res.status(500).json({ error: '点検項目の取得に失敗しました' });
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

      // ファイル名をクエリパラメータから取得
      let fileName = req.query.fileName as string;

      // ファイル名が指定されていない場合は元のファイル名に年月日を付加
      if (!fileName) {
        const originalFilename = req.file.originalname;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const baseName = originalFilename.replace(/\.csv$/i, '');
        fileName = `${baseName}_${dateStr}.csv`;
      }

      // CSVファイルパス
      const csvFilePath = path.join(assetsDir, fileName);

      // ファイルを保存
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

// CSVデータを保存するAPI
app.post('/api/save-inspection-data', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  try {
    const { data, fileName, sourceFileName } = req.body;

    if (!data) {
      return res.status(400).json({ error: '保存するデータがありません' });
    }

    // ファイル名が指定されていない場合はデフォルト名
    const outputFileName = fileName || `仕業点検_編集済_${new Date().toISOString().slice(0, 10)}.csv`;

    // attached_assetsディレクトリのチェックと作成
    const assetsDir = path.join(process.cwd(), 'attached_assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // ソースファイルのパス（元のCSVファイル）
    const sourceFilePath = path.join(assetsDir, sourceFileName || '仕業点検マスタ.csv');

    // 元のCSVファイルが存在する場合、ヘッダー行を取得
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

    // 英語フィールド名と日本語フィールド名のマッピング
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

    // データを処理して日本語フィールドにデータをコピー
    const processedData = data.map(item => {
      const newItem = { ...item };

      // 英語フィールドから日本語フィールドにデータをコピー
      Object.entries(fieldMapping).forEach(([engField, jpField]) => {
        if (item[engField] !== undefined && item[engField] !== null) {
          newItem[jpField] = item[engField];
        }
      });

      return newItem;
    });

    // 点検記録情報がある場合はヘッダーとして追加
    let headerComments = '';
    if (req.body.inspectionRecord) {
      const record = req.body.inspectionRecord;
      headerComments = [
        `#点検年月日: ${record.点検年月日 || ''}`,
        `#開始時刻: ${record.開始時刻 || ''}`,
        `#終了時刻: ${record.終了時刻 || ''}`,
        `#実施箇所: ${record.実施箇所 || ''}`,
        `#責任者: ${record.責任者 || ''}`,
        `#点検者: ${record.点検者 || ''}`,
        `#引継ぎ: ${record.引継ぎ || ''}`,
        ''  // 空行を追加
      ].join('\n') + '\n';
    }

    // JSONデータの場合はCSV形式に変換
    // 元のヘッダーがある場合は、それを優先して使用
    if (originalHeaders.length > 0) {
      console.log('元のヘッダーを使用します:', originalHeaders);

      // 新しいデータのキーを取得
      const newKeys = Object.keys(processedData[0] || {});

      // 元のヘッダーに無い新しいフィールドを追加
      newKeys.forEach(key => {
        if (!originalHeaders.includes(key)) {
          originalHeaders.push(key);
          console.log('新しいフィールドを追加しました:', key);
        }
      });

      // カスタムヘッダーでCSV変換
      csvContent = Papa.unparse({
        fields: originalHeaders,
        data: processedData
      }, {
        header: true,
        delimiter: ',',
        quoteChar: '"'
      });
    } else {
      // 元のヘッダーがない場合は通常の変換
      csvContent = Papa.unparse(processedData, {
        header: true,
        delimiter: ',',
        quoteChar: '"'
      });
    }

    // 点検記録情報がある場合は、CSVの先頭に追加
    if (headerComments) {
      csvContent = headerComments + csvContent;
    }

    // CSVファイルパス
    const csvFilePath = path.join(assetsDir, outputFileName);

    // ファイルを保存
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');

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

// 利用可能なCSVファイル一覧を取得するAPI - Modified to use async/await and promisify
app.get('/api/inspection-files', async (req, res) => {
  try {
    if (!fs.existsSync(INSPECTION_FILES_DIR)) {
      fs.mkdirSync(INSPECTION_FILES_DIR, { recursive: true }); // Create directory if it doesn't exist
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
            // 最終更新日の数値表現（ソート用）
            modifiedTime: new Date(stats.mtime).getTime()
          };
        })
    );

    // 更新日時の新しい順にソート
    fileDetails.sort((a, b) => b.modifiedTime - a.modifiedTime);

    res.json({ 
      files: fileDetails,
      // 最新のファイル名も提供
      latestFile: fileDetails.length > 0 ? fileDetails[0].name : null 
    });
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    res.status(500).json({ error: 'ファイル一覧の取得に失敗しました' });
  }
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