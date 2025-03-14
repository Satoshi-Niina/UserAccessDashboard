// ユーザー管理ページコンポーネント
// ユーザーの追加、編集、削除機能を提供
// 権限管理とアクセス制御を実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  password?: string;
};

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    isAdmin: false,
  });

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ユーザー一覧の取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "", 
      isAdmin: user.isAdmin,
    });
  };

  const clearForm = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      password: "",
      isAdmin: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;

      if (selectedUser) {
        response = await fetch(`/api/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: "成功",
        description: selectedUser ? "ユーザー情報を更新しました" : "ユーザーを登録しました",
      });

      clearForm();
      loadUsers();
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "処理に失敗しました",
        variant: "destructive",
      });
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex h-screen">
        <Sidebar onExpandChange={setIsMenuExpanded} />
        <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
          <main className="p-6">
            <h1 className="text-3xl font-bold mb-6">アクセス権限がありません</h1>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">ユーザー管理</h1>
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
                    <Label htmlFor="password">
                      パスワード {selectedUser && "(変更する場合のみ入力)"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!selectedUser}
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
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {selectedUser ? "更新" : "登録"}
                    </Button>
                    {selectedUser && (
                      <>
                        <Button type="button" variant="outline" onClick={clearForm}>
                          キャンセル
                        </Button>
                        {selectedUser.id !== user?.id && (
                          <Button 
                            type="button" 
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm("このユーザーを削除しますか？")) {
                                return;
                              }
                              try {
                                const response = await fetch(`/api/users/${selectedUser.id}`, {
                                  method: "DELETE"
                                });
                                if (!response.ok) {
                                  const error = await response.json();
                                  throw new Error(error.error);
                                }
                                toast({
                                  title: "成功",
                                  description: "ユーザーを削除しました"
                                });
                                clearForm();
                                loadUsers();
                              } catch (error) {
                                toast({
                                  title: "エラー",
                                  description: error instanceof Error ? error.message : "削除に失敗しました",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            削除
                          </Button>
                        )}
                      </>
                    )}
                  </div>
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
                        <th className="text-left p-2">パスワード</th>
                        <th className="text-left p-2">権限</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-t cursor-pointer hover:bg-accent/50 transition-colors ${
                            selectedUser?.id === user.id ? "bg-accent" : ""
                          }`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <td className="p-2">{user.username}</td>
                          <td className="p-2">••••••</td>
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
    </div>
  );
}