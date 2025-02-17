
import { Database } from "sqlite3";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const db = new Database('./database.sqlite');
  const hashedPassword = await hashPassword("0077");
  
  db.run(`
    INSERT OR REPLACE INTO users (username, password, is_admin) 
    VALUES ('niina', ?, 1)
  `, [hashedPassword], (err) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Admin user created successfully');
    }
    db.close();
  });
}

main().catch(console.error);
