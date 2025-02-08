import { Sidebar } from "@/components/layout/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function Operations() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">運用管理</h1>
        <Tabs defaultValue="inspection" className="w-full">
          <TabsList>
            <TabsTrigger value="inspection">仕業点検</TabsTrigger>
            <TabsTrigger value="performance">運用実績</TabsTrigger>
          </TabsList>
          <TabsContent value="inspection">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">仕業点検</h2>
                <p className="text-muted-foreground">
                  日常の点検業務をデジタル化し、正確な記録と管理を実現します。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="performance">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">運用実績</h2>
                <p className="text-muted-foreground">
                  運用状況の実績を記録し、効率的な業務改善に活用します。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
