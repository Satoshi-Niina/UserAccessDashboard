
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";

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

// API endpoint for CSV data
app.get('/api/inspection-items', async (req, res) => {
  try {
    console.log("API: /api/inspection-items が呼び出されました");
    
    // ESモジュールで動的にimportする
    const fs = await import('fs');
    const path = await import('path');
    
    const csvPath = path.join(process.cwd(), 'attached_assets', '仕業点検マスタ.csv');
    console.log(`CSVファイルパス: ${csvPath}`);
    
    if (fs.existsSync(csvPath)) {
      console.log(`CSVファイルが見つかりました: ${csvPath}`);
      const data = fs.readFileSync(csvPath, 'utf8');
      console.log(`CSVデータ読み込み成功 (${data.length} バイト)`);
      console.log(`CSVデータの最初の100文字: ${data.substring(0, 100)}`);
      
      // データの内容をログに出力（デバッグ用）
      const lines = data.split('\n');
      console.log(`CSVの行数: ${lines.length}`);
      if (lines.length > 0) {
        console.log(`ヘッダー: ${lines[0]}`);
      }
      if (lines.length > 1) {
        console.log(`最初のデータ行: ${lines[1]}`);
      }
      
      // CSVファイルのヘッダー情報を設定して送信
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.send(data);
    } else {
      console.error(`CSVファイルが見つかりません: ${csvPath}`);
      
      // ディレクトリの確認
      const attachedDir = path.join(process.cwd(), 'attached_assets');
      const availableFiles = fs.existsSync(attachedDir) ? fs.readdirSync(attachedDir) : [];
      
      console.log(`利用可能なファイル: ${availableFiles.join(', ')}`);
      
      // サンプルCSVデータを返す
      const sampleData = `製造メーカー,機種,エンジン型式,部位,装置,手順,確認箇所,判断基準,確認要領,測定等記録,図形記録
堀川工機,MC300,ボルボ,エンジン,本体,,エンジンヘッドカバー、ターボ,オイル、燃料漏れ,オイル等滲み・垂れ跡が無,,
,,,エンジン,本体,,排気及び吸気,排気ガス色及びガス漏れ等の点検（マフラー等）,ほぼ透明の薄紫,,`;
      
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.send(sampleData);
    }
  } catch (error) {
    console.error('Error reading CSV file:', error);
    res.status(500).json({
      error: 'Error reading CSV file',
      message: error instanceof Error ? error.message : '不明なエラーが発生しました'
    });
  }
});

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

  // CSVファイルの提供
  app.get("/api/inspection-data", (req, res) => {
    import('fs').then(fs => {
      import('path').then(async path => {
        try {
          const csvPath = path.join(process.cwd(), 'attached_assets', '仕業点検マスタ.csv');
          if (fs.existsSync(csvPath)) {
            const data = fs.readFileSync(csvPath, 'utf8');
            res.set('Content-Type', 'text/csv');
            res.send(data);
          } else {
            res.status(404).json({ error: "CSVファイルが見つかりません" });
          }
        } catch (error) {
          console.error("CSVファイル読み込みエラー:", error);
          res.status(500).json({ error: "CSVファイルの読み込みに失敗しました" });
        }
      }).catch(error => {
        console.error("Path importエラー:", error);
        res.status(500).json({ error: "CSVファイルの読み込みに失敗しました" });
      });
    }).catch(error => {
      console.error("FS importエラー:", error);
      res.status(500).json({ error: "CSVファイルの読み込みに失敗しました" });
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
