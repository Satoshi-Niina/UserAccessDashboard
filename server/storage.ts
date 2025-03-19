import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
const SQLiteSessionStore = SQLiteStore(session);
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

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
    try {
      const csvPath = path.join(process.cwd(), 'attached_assets/inspection/table/models.csv');
      if (!fs.existsSync(csvPath)) {
        return [];
      }
      const content = fs.readFileSync(csvPath, 'utf-8');
      const models = Papa.parse(content, { header: true }).data;
      return models;
    } catch (error) {
      console.error('Error reading models:', error);
      return [];
    }
  }

  async getManufacturers(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM manufacturers', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows || []); // Handle potential null result
      });
    });
  }

  async createManufacturer({ name, code }: { name: string, code?: string }): Promise<any> {
    try {
      const csvPath = path.join(process.cwd(), 'attached_assets/inspection/table/manufacturers.csv');
      let manufacturers = [];
      
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf-8');
        manufacturers = Papa.parse(content, { header: true }).data;
      }

      const newId = manufacturers.length > 0 ? Math.max(...manufacturers.map(m => parseInt(m.id))) + 1 : 1;
      const newManufacturer = { id: newId, name, code };
      manufacturers.push(newManufacturer);

      if (!fs.existsSync(path.dirname(csvPath))) {
        fs.mkdirSync(path.dirname(csvPath), { recursive: true });
      }
      fs.writeFileSync(csvPath, Papa.unparse(manufacturers));

      return newManufacturer;
    } catch (error) {
      console.error('Error creating manufacturer:', error);
      throw error;
    }
  }

  async createModel({ name, code, manufacturerId }: { name: string, code?: string, manufacturerId: number }): Promise<any> {
    try {
      const csvPath = path.join(process.cwd(), 'attached_assets/inspection/table/models.csv');
      let models = [];
      
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf-8');
        models = Papa.parse(content, { header: true }).data;
      }

      const newId = models.length > 0 ? Math.max(...models.map(m => parseInt(m.id))) + 1 : 1;
      const newModel = { id: newId, name, code, manufacturerId };
      models.push(newModel);

      if (!fs.existsSync(path.dirname(csvPath))) {
        fs.mkdirSync(path.dirname(csvPath), { recursive: true });
      }
      fs.writeFileSync(csvPath, Papa.unparse(models));

      return newModel;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  async createMachineNumber({ number, modelId }: { number: string, modelId: number }): Promise<any> {
    try {
      const csvPath = path.join(process.cwd(), 'attached_assets/inspection/table/machine_numbers.csv');
      const dirPath = path.dirname(csvPath);
      let machines = [];
      
      // ディレクトリが存在しない場合は作成
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // ファイルが存在する場合は既存データを読み込む
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf-8');
        machines = Papa.parse(content, { header: true }).data;
      }

      // モデル情報を取得
      const models = await this.getModels();
      const model = models.find(m => String(m.id) === String(modelId));

      if (!model) {
        console.log('利用可能なモデル:', models);
        console.log('選択されたモデルID:', modelId);
        throw new Error('指定された機種が見つかりません');
      }

      // 新しい機械番号を追加
      const newMachine = { 
        number,
        model_id: modelId,
        model_name: model.name
      };
      machines.push(newMachine);

      // CSVファイルに保存
      fs.writeFileSync(csvPath, Papa.unparse(machines));
      console.log('Machine number saved:', newMachine);

      return newMachine;
    } catch (error) {
      console.error('Error creating machine number:', error);
      throw error;ror;
    }
  }

  async getMachineNumberByNumber(number: string): Promise<any> {
    try {
      const csvPath = path.join(process.cwd(), 'attached_assets/inspection/table/machine_numbers.csv');
      if (!fs.existsSync(csvPath)) {
        return null;
      }
      
      const content = fs.readFileSync(csvPath, 'utf-8');
      const machines = Papa.parse(content, { header: true }).data;
      
      const machine = machines.find((m: any) => m.number === number);
      if (!machine) {
        return null;
      }

      // モデル情報を取得
      const models = await this.getModels();
      const model = models.find((m: any) => String(m.id) === String(machine.model_id));
      
      if (!model) {
        return null;
      }

      return {
        number: machine.number,
        model_name: model.name,
        manufacturer_name: model.manufacturer
      };
    } catch (error) {
      console.error('Error getting machine number:', error);
      return null;
    }
  }

  async getMachineNumberById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          mn.number,
          m.name as model_name,
          mf.name as manufacturer_name
        FROM machine_numbers mn
        INNER JOIN models m ON mn.model_id = m.id
        INNER JOIN manufacturers mf ON m.manufacturer_id = mf.id
        WHERE mn.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
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