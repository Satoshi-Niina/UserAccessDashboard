import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ username: string; isAdmin: boolean }>>([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    isAdmin: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("ユーザー一覧の取得に失敗しました");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("ユーザー一覧取得エラー:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert("ユーザーを登録しました");
      setFormData({ username: "", password: "", isAdmin: false });
      await loadUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "ユーザー登録に失敗しました");
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">アクセス権限がありません</h1>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">ユーザー登録</h1>
        <div className="grid gap-6">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isAdmin: checked as boolean })
                    }
                  />
                  <Label htmlFor="isAdmin">管理者権限を付与</Label>
                </div>
                <Button type="submit" className="w-full">
                  登録
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">登録済みユーザー一覧</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2">ユーザー名</th>
                      <th className="text-left p-2">権限</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{user.username}</td>
                        <td className="p-2">{user.isAdmin ? "管理者" : "一般"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}