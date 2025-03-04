
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
  const BASE_PORT = Number(process.env.PORT || 5000);
  let server_started = false;
  
  // ポートをチェックする関数（非同期で1つずつ）
  const findAvailablePort = async () => {
    for (let port = BASE_PORT; port < BASE_PORT + 20; port++) {
      try {
        // サーバーを起動してみる
        await new Promise((resolve, reject) => {
          const tempServer = require('http').createServer();
          
          tempServer.once('error', (err: any) => {
            tempServer.close();
            if (err.code === 'EADDRINUSE') {
              log(`Port ${port} is already in use.`);
              reject(new Error(`Port ${port} is already in use`));
            } else {
              reject(err);
            }
          });
          
          tempServer.once('listening', () => {
            log(`Found available port: ${port}`);
            tempServer.close(() => resolve(port));
          });
          
          tempServer.listen(port, '0.0.0.0');
        });
        
        // 使用可能なポートが見つかった
        if (!server_started) {
          server_started = true;
          startServer(port);
        }
        return;
      } catch (err) {
        // このポートは使用中なので、次のポートを試す
        continue;
      }
    }
    
    // すべてのポートが使用中
    log(`Failed to find an available port in range ${BASE_PORT}-${BASE_PORT + 19}`);
    process.exit(1);
  };
  
  // サーバーを単一のポートで起動する関数
  const startServer = (port: number) => {
    try {
      server.listen(port, '0.0.0.0', () => {
        log(`Server is running on port ${port}`);
      });
    } catch (err) {
      log(`Failed to start server: ${err}`);
      process.exit(1);
    }
  };
  
  // サーバー起動プロセスを開始
  findAvailablePort();
  
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
