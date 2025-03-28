class Router {
    constructor() {
        this.routes = new Map();
        this.defaultRoute = '/';
        
        // ブラウザの戻る/進むボタンのハンドリング
        window.addEventListener('popstate', () => this.handleRoute());
        
        // 初期ルートのハンドリング
        document.addEventListener('DOMContentLoaded', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    setDefaultRoute(path) {
        this.defaultRoute = path;
    }

    navigate(path) {
        history.pushState(null, '', path);
        this.handleRoute();
    }

    async handleRoute() {
        const path = window.location.pathname;
        const handler = this.routes.get(path) || this.routes.get(this.defaultRoute);
        
        if (handler) {
            const content = await handler();
            document.getElementById('pageContent').innerHTML = content;
        }
    }
}

const router = new Router();

// ルートの定義
router.addRoute('/', async () => {
    return `
        <h1 class="page-title">ようこそ</h1>
        <div class="card">
            <p>このシステムは、効率的な業務管理と円滑なコミュニケーションを実現するための総合プラットフォームです。</p>
        </div>
    `;
});

router.addRoute('/auth', async () => {
    if (auth.user) {
        router.navigate('/');
        return '';
    }

    return `
        <div class="auth-container">
            <div class="auth-card">
                <h2>ログイン</h2>
                <form onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label class="form-label">ユーザー名</label>
                        <input type="text" class="form-input" name="username" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">パスワード</label>
                        <input type="password" class="form-input" name="password" required>
                    </div>
                    <button type="submit" class="button button-primary">ログイン</button>
                </form>
            </div>
        </div>
    `;
});

// その他のルートを追加...

// リンクのクリックイベントを処理
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="/"]')) {
        e.preventDefault();
        router.navigate(e.target.getAttribute('href'));
    }
});