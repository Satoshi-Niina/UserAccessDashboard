// メッセージページコンポーネント
// チーム間のコミュニケーション機能を提供
// サイドバーとメインコンテンツのレイアウトを実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Messages() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">メッセージ</h1>
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