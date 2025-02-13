import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

// Assuming hashPassword function exists elsewhere, e.g., in ./auth.ts or a separate password-handling module
const hashPassword = async (password:string) => {
    //Implementation to hash the password,  replace with your actual hashing logic.  Example using bcrypt:
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};


export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // ユーザー一覧の取得 (管理者のみ)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "管理者権限が必要です" });
    }

    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        username: user.username,
        isAdmin: user.isAdmin
      })));
    } catch (error) {
      console.error("ユーザー一覧取得エラー:", error);
      res.status(500).json({ error: "ユーザー一覧の取得に失敗しました" });
    }
  });

  // 新規ユーザーの登録 (管理者のみ)
  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
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
        isAdmin: isAdmin || false
      });

      res.status(201).json({
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("ユーザー登録エラー:", error);
      res.status(500).json({ error: "ユーザー登録に失敗しました" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}