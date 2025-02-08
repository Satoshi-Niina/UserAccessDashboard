import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function BasicData() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">基本データ処理</h1>
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Database className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                システムの基本データを管理します。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
