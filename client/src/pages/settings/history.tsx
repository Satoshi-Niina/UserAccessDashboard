// 履歴ページコンポーネント
// システムの操作履歴とログを表示
// フィルタリングと検索機能を実装
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";
import { useState } from "react";

export default function History() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">履歴検索</h1>
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <HistoryIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  システムの操作履歴を確認できます。
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}