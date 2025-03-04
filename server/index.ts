
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
  const PORT = process.env.PORT || 5000;
  
  // 既存のすべてのプロセスを終了するためのクリーンアップ関数
  let serverInstance: any = null;
  
  // 一度のみサーバーを起動する
  function startServer() {
    // 使用するポートを順番に試す
    const tryPort = (port: number, maxPort: number) => {
      if (port > maxPort) {
        log(`Failed to find an available port between ${PORT} and ${maxPort}`);
        process.exit(1);
        return;
      }
      
      const instance = server.listen(port, "0.0.0.0");
      
      instance.on('listening', () => {
        serverInstance = instance;
        log(`serving on port ${port}`);
      });
      
      instance.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use. Trying port ${port + 1}...`);
          instance.close();
          tryPort(port + 1, maxPort);
        } else {
          log(`Server error: ${err.message}`);
          throw err;
        }
      });
    };
    
    tryPort(Number(PORT), Number(PORT) + 10); // Try up to 10 ports
  }
  
  // サーバーの起動
  startServer();
  
  // グレースフルシャットダウンの処理
  const shutdown = () => {
    if (serverInstance) {
      log('Shutting down server...');
      serverInstance.close();
    }
    process.exit(0);
  };
  
  // シグナルハンドラの設定
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
