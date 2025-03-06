// メッセージページコンポーネント
// チャットやメッセージングの機能を提供
// リアルタイムコミュニケーションを実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { ExitButton } from "@/components/layout/exit-button";

export default function Messages() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // メッセージデータ保存の実装
  const saveMessages = async () => {
    try {
      // ここに実際のメッセージ保存ロジックを実装
      console.log("メッセージを保存しました");
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error("メッセージ保存エラー:", error);
      return false;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">メッセージ</h1>
            <ExitButton 
              hasChanges={hasChanges}
              onSave={saveMessages}
            />
          </div>
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  チーム間のリアルタイムコミュニケーションを促進します。
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}