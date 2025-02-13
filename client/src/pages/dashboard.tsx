import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

export default function Dashboard() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">ようこそ</h1>
          <p className="text-muted-foreground">
            このシステムは、効率的な業務管理と円滑なコミュニケーションを実現するための総合プラットフォームです。
          </p>
        </main>
      </div>
    </div>
  );
}