import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
const SQLiteSessionStore = SQLiteStore(session);
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);


export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>; // Added deleteUser method
  sessionStore: session.Store;
  getModels():Promise<any[]>; //Added getModels method
  getManufacturers():Promise<any[]>; //Added getManufacturers method
  createMachineNumber(data: {number: string, modelId: number, manufacturerId: number}): Promise<any>; // Added createMachineNumber
  getMachineNumbers(): Promise<any[]>; // Added getMachineNumbers

}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new SQLiteSessionStore({ 
      createDatabaseTable: true
    }, db);

    // テーブルの作成
    db.run(`
      CREATE TABLE IF NOT EXISTS machine_numbers (
        number VARCHAR(50) PRIMARY KEY,
        model_id INTEGER NOT NULL,
        manufacturer_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (model_id) REFERENCES models(id),
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
      )
    `);
  }

  async getUser(id: number): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  async getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
        [insertUser.username, insertUser.password, insertUser.is_admin ? 1 : 0], 
        function(err) {
          if (err) reject(err);
          resolve({ ...insertUser, id: this.lastID });
        });
    });
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];

    return new Promise((resolve, reject) => {
      db.run(`UPDATE users SET ${fields} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        this.getUser(id).then(resolve).catch(reject);
      });
    });
  }

  async deleteUser(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async getModels(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM models', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []); // Handle potential null result
      });
    });
  }

  async getManufacturers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM manufacturers', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []); // Handle potential null result
      });
    });
  }

  async createMachineNumber({ number, modelId }: {number: string, modelId: number}): Promise<any> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO machine_numbers (number, model_id) VALUES (?, ?)',
        [number, modelId],
        function(err) {
          if (err) reject(err);
          resolve({ number, modelId });
        }
      );
    });
  }

  async getMachineNumbers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          mn.number,
          m.name as model_name,
          mf.name as manufacturer_name
        FROM machine_numbers mn
        INNER JOIN models m ON mn.model_id = m.id
        INNER JOIN manufacturers mf ON m.manufacturer_id = mf.id
      `, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []); // Handle potential null result
      });
    });
  }

  async getInspectionItems(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM inspection_items ORDER BY id', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      });
    });
  }
}

// 初期管理者ユーザーのセットアップ
const setupInitialAdmin = async () => {
  db.serialize(() => {
    db.get('SELECT * FROM users WHERE username = ?', ['niina'], async (err, row) => {
      if (err) {
        console.error('Error checking admin:', err);
        return;
      }

      if (!row) {
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync("0077", salt, 64)) as Buffer;
        const hashedPassword = `${buf.toString("hex")}.${salt}`;

        db.run(
          'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
          ['niina', hashedPassword, 1],
          (err) => {
            if (err) {
              console.error('Error creating admin:', err);
            } else {
              console.log('Initial admin user created');
            }
          }
        );
      } else if (!row.is_admin) {
        db.run('UPDATE users SET is_admin = 1 WHERE username = ?', ['niina'], (err) => {
          if (err) {
            console.error('Error updating admin status:', err);
          } else {
            console.log('Admin status updated for niina');
          }
        });
      }
    });
  });
};

setupInitialAdmin().catch(console.error);

export const storage = new DatabaseStorage();