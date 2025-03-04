
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Expressアプリケーションの初期化
const app = express();
// JSONとURLエンコードされたボディの解析を有効化
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// キャッシュ無効化ミドルウェア
app.use((req, res, next) => {
  // キャッシュを無効化するヘッダーを設定
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// リクエストロギングミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // レスポンスのJSONをキャプチャするためのオーバーライド
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // レスポンス完了時のログ出力
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // ログ行の長さを制限
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// アプリケーションの起動処理
(async () => {
  const server = registerRoutes(app);

  // エラーハンドリングミドルウェア
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // 開発環境の場合はViteのセットアップを行う
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // サーバーの起動（ポート5000または環境変数から）
  const PORT = Number(process.env.PORT || 5000);
  
  // サーバーをシンプルに起動する関数
  const startServer = () => {
    // ポート使用時のエラーハンドリングを追加
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${PORT} is already in use. Please kill any processes using this port and try again.`);
        process.exit(1);
      } else {
        log(`Server error: ${err}`);
        process.exit(1);
      }
    });
    
    // サーバーを起動
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server is running on port ${PORT}`);
    });
  };
  
  // サーバー起動プロセスを開始
  startServer();
  
  // グレースフルシャットダウンの処理
  const shutdown = () => {
    log('Shutting down server...');
    server.close();
    process.exit(0);
  };
  
  // シグナルハンドラの設定
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
