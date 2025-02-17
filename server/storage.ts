
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import MySQLStore from "express-mysql-session";

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

export const storage = new DatabaseStorage();
