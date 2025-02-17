import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
import { eq } from "drizzle-orm";

const MySQLSessionStore = MySQLStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MySQLSessionStore({ 
      createDatabaseTable: true
    }, db);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  async getAllUsers(): Promise<User[]> {
    const [rows] = await db.query('SELECT * FROM users');
    return rows;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [result] = await db.query('INSERT INTO users SET ?', [insertUser]);
    return { ...insertUser, id: result.insertId };
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    await db.query('UPDATE users SET ? WHERE id = ?', [updateData, id]);
    return this.getUser(id) as Promise<User>;
  }
}

// 初期管理者ユーザーのセットアップ
const setupInitialAdmin = async () => {
  const adminExists = await db.select().from(users).where(eq(users.username, 'niina'));
  if (adminExists.length === 0) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("0077", salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    await db.insert(users).values({
      username: 'niina',
      password: hashedPassword,
      isAdmin: true
    });
    console.log('Initial admin user created');
  }
};

setupInitialAdmin().catch(console.error);

export const storage = new DatabaseStorage();