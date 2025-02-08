// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // 認証状態に基づいてリダイレクト
    if (!auth.user && window.location.pathname !== '/auth') {
        router.navigate('/auth');
    }

    // 認証フォームのイベントハンドラー
    window.handleLogin = async (event) => {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const password = form.password.value;

        if (await auth.login(username, password)) {
            router.navigate('/');
        } else {
            alert('ログインに失敗しました');
        }
    };

    window.handleRegister = async (event) => {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const password = form.password.value;
        const isAdmin = form.isAdmin.checked;

        if (await auth.register(username, password, isAdmin)) {
            router.navigate('/');
        } else {
            alert('登録に失敗しました');
        }
    };

    // 認証タブの切り替え
    document.addEventListener('click', (e) => {
        if (e.target.matches('.auth-tab')) {
            const tabName = e.target.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(tab => {
                tab.classList.toggle('active', tab === e.target);
            });
            document.getElementById('loginForm').classList.toggle('hidden', tabName !== 'login');
            document.getElementById('registerForm').classList.toggle('hidden', tabName !== 'register');
        }
    });
});

// アクティブなナビゲーションアイテムの更新
function updateActiveNavItem() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('href') === currentPath);
    });
}

// ルート変更時にナビゲーションを更新
router.addListener(updateActiveNavItem);
window.addEventListener('popstate', updateActiveNavItem);
