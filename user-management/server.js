import express from 'express';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from '../shared/schema.ts';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import session from 'express-session';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

app.use(express.json());
app.use(express.static('user-management'));
app.use('/attached_assets', express.static('attached_assets'));
app.use(session({
    secret: process.env.REPL_ID,
    resave: false,
    saveUninitialized: false
}));

// 管理者認証ミドルウェア
const requireAdmin = async (req, res, next) => {
    if (!req.session.user?.isAdmin) {
        return res.status(403).json({ error: '管理者権限が必要です' });
    }
    next();
};

// 管理者ログイン
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        if (!user[0] || !user[0].isAdmin || !(await comparePasswords(password, user[0].password))) {
            return res.status(401).json({ error: 'ユーザー名またはパスワードが違います' });
        }

        req.session.user = user[0];
        res.json({ message: 'ログイン成功' });
    } catch (error) {
        console.error('ログインエラー:', error);
        res.status(500).json({ error: 'ログインに失敗しました' });
    }
});

// 管理者ログアウト
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'ログアウト成功' });
});

// ユーザー一覧取得 (管理者のみ)
app.get('/api/users', requireAdmin, async (req, res) => {
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

// ユーザー登録 (管理者のみ)
app.post('/api/users', requireAdmin, async (req, res) => {
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

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ユーザー管理システムが起動しました: http://0.0.0.0:${PORT}`);
});