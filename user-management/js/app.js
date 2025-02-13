document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    
    document.getElementById('userForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            isAdmin: document.getElementById('isAdmin').checked
        };
        
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            
            alert('ユーザーを登録しました');
            document.getElementById('userForm').reset();
            loadUsers();
        } catch (error) {
            alert(error.message);
        }
    });
});

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const tbody = document.querySelector('#userTable tbody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.isAdmin ? '管理者' : '一般'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteUser('${user.username}')">
                        削除
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('ユーザー一覧の取得に失敗しました:', error);
    }
}

async function deleteUser(username) {
    if (!confirm(`${username}を削除してもよろしいですか？`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${username}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('ユーザーの削除に失敗しました');
        }
        
        loadUsers();
    } catch (error) {
        alert(error.message);
    }
}
