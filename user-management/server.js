import express from 'express';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from '../shared/schema.ts';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
}

app.use(express.json());
app.use(express.static('user-management'));

// ユーザー一覧取得
app.get('/api/users', async (req, res) => {
    try {
        const userList = await db.select().from(users);
        res.json(userList.map(user => ({
            username: user.username,
            isAdmin: user.isAdmin
        })));
    } catch (error) {
        console.error('ユーザー一覧取得エラー:', error);
        res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' });
    }
});

// ユーザー登録
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, isAdmin } = req.body;
        
        // ユーザー名の重複チェック
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.username, username));
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'ユーザー名が既に存在します' });
        }

        const hashedPassword = await hashPassword(password);
        const [user] = await db.insert(users)
            .values({
                username,
                password: hashedPassword,
                isAdmin: isAdmin || false
            })
            .returning();

        res.status(201).json({
            username: user.username,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('ユーザー登録エラー:', error);
        res.status(500).json({ error: 'ユーザー登録に失敗しました' });
    }
});

// サーバー起動
const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ユーザー管理システムが起動しました: http://0.0.0.0:${PORT}`);
});
