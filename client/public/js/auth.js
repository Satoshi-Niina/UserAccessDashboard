class Auth {
    constructor() {
        this.user = null;
        this.isLoading = true;
        this.listeners = new Set();
    }

    async init() {
        try {
            const response = await fetch('/api/auth/validate');
            if (response.ok) {
                this.user = await response.json();
            }
        } catch (error) {
            console.error('認証の初期化に失敗しました:', error);
        } finally {
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('ユーザー名またはパスワードが違います');
            }

            this.user = await response.json();
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('ログインエラー:', error);
            return false;
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
            this.user = null;
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('ログアウトエラー:', error);
            return false;
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.user));
    }

    isAdmin() {
        return this.user?.isAdmin === true;
    }
}

const auth = new Auth();
auth.init();

// 管理者メニューの表示制御
auth.addListener(user => {
    document.body.classList.toggle('is-admin', user?.isAdmin === true);
});