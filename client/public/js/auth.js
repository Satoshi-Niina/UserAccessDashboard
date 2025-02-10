class Auth {
    constructor() {
        this.user = null;
        this.isLoading = true;
        this.listeners = new Set();

        // 事前定義されたユーザー
        this.predefinedUsers = {
            'niina': {
                password: '0077',
                isAdmin: true
            }
        };
    }

    async init() {
        this.isLoading = false;
        this.notifyListeners();
    }

    async login(username, password) {
        try {
            const user = this.predefinedUsers[username];
            if (!user || user.password !== password) {
                throw new Error('ユーザー名またはパスワードが違います');
            }

            this.user = {
                username: username,
                isAdmin: user.isAdmin
            };

            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('ログインエラー:', error);
            return false;
        }
    }

    async logout() {
        try {
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

// ログアウトボタンのイベントリスナー
document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth.logout().then(() => {
        window.location.href = '/auth';
    });
});

// 管理者メニューの表示制御
auth.addListener(user => {
    document.body.classList.toggle('is-admin', user?.isAdmin === true);
});