import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const hashedPassword = await hashPassword("0077");
  console.log(`INSERT INTO users (username, password, is_admin) VALUES ('niina', '${hashedPassword}', true) ON CONFLICT (username) DO UPDATE SET password = '${hashedPassword}', is_admin = true;`);
}

main();
