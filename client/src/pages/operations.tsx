import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// Added placeholder for missing import
import { useToast } from "@/components/ui/use-toast";


// インスペクション項目のタイプ定義
interface InspectionItem {
  id: number;
  name: string;
  order: number;
  category: string;
}

// モック用のデータ
const mockInspectionItems: InspectionItem[] = [
  { id: 1, name: "エンジンオイル量", order: 1, category: "エンジン" },
  { id: 2, name: "ブレーキパッド摩耗", order: 2, category: "ブレーキ系統" },
  { id: 3, name: "タイヤ空気圧", order: 3, category: "タイヤ" },
  { id: 4, name: "ヘッドライト動作", order: 4, category: "電気系統" },
];

export default function Operations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState(mockInspectionItems);
  const [activeTab, setActiveTab] = useState("inspection");

  // ドラッグ&ドロップ完了時のハンドラ
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, movedItem);

    // 順序を更新
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setItems(updatedItems);
    toast({
      title: "順序を更新しました",
      description: "検査項目の順序が保存されました。",
    });
  };

  // 新規項目追加のハンドラ
  const handleAddItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    const newItem: InspectionItem = {
      id: newId,
      name: `新規項目 ${newId}`,
      order: items.length + 1,
      category: "未分類",
    };
    setItems([...items, newItem]);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">運用管理</h1>
          <p className="text-muted-foreground">
            検査項目や運用状況を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddItem}>
            項目追加
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="inspection">検査項目管理</TabsTrigger>
          <TabsTrigger value="operation">運用状況</TabsTrigger>
        </TabsList>

        <TabsContent value="inspection">
          <Card>
            <CardHeader>
              <CardTitle>検査項目一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="inspection-items">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {items.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={`item-${item.id}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between p-3 bg-card border rounded-md"
                            >
                              <div>
                                <span className="font-medium mr-2">{item.order}.</span>
                                <span>{item.name}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {item.category}
                                </span>
                              </div>
                              <Button variant="ghost" size="sm">
                                編集
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operation">
          <Card>
            <CardHeader>
              <CardTitle>運用状況</CardTitle>
            </CardHeader>
            <CardContent>
              <p>運用状況の管理画面は開発中です。</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}