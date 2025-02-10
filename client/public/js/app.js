// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // 認証状態に基づいてリダイレクト
    if (!auth.user && window.location.pathname !== '/auth') {
        router.navigate('/auth');
    }

    // ログインフォームのイベントハンドラー
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

    // ログアウトボタンのイベントハンドラー
    document.getElementById('logoutButton')?.addEventListener('click', () => {
        auth.logout().then(() => {
            router.navigate('/auth');
        });
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