import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UserManagement() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">ユーザー登録</h1>
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                システムユーザーの登録と管理を行います。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
