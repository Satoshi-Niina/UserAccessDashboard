import { Sidebar } from "@/components/layout/sidebar";

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 ml-16">
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