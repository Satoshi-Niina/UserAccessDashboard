import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";

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
        id: user.id,
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
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("ユーザー登録エラー:", error);
      res.status(500).json({ error: "ユーザー登録に失敗しました" });
    }
  });

  // ユーザー情報の更新 (管理者のみ)
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
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

  const httpServer = createServer(app);
  return httpServer;
}