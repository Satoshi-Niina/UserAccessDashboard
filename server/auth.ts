
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// グローバル型定義の拡張
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// パスワードのハッシュ化関数
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// パスワードの比較関数
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// 認証設定のセットアップ
export function setupAuth(app: Express) {
  // セッション設定
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  // Passportとセッションの初期化
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // ローカル認証戦略の設定
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  // セッション管理用の関数設定
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error('User not found'), null);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // 認証関連のルート設定
  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    });
  });

  // ログイン処理
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user!;
    res.status(200).json(userWithoutPassword);
  });

  // ログアウト処理
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // ユーザー情報取得
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user;
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      isAdmin: user.isAdmin
    });
  });
}
