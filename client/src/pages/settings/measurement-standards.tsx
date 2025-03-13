import React, { useState, useEffect } from "react";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { InspectionValueStatus } from "@/components/InspectionValueStatus";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";

export default function MeasurementStandards() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(true); // Always expanded
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState([]);
  const { toast } = useToast();

  // CSVデータの取得
  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        const response = await fetch("/api/inspection-items");
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const data = await response.json();
        setInspectionItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error("Error fetching inspection items:", error);
        toast({
          title: "エラー",
          description: "点検項目データの取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, [toast]);

  // 装置・部位でフィルタリング
  const filterByEquipment = (equipment) => {
    if (!equipment) {
      setFilteredItems(inspectionItems);
    } else {
      const filtered = inspectionItems.filter(item => item.装置 === equipment);
      setFilteredItems(filtered);
    }
  };

  // 装置リストの作成（重複なし）
  const uniqueEquipments = Array.from(new Set(inspectionItems.map(item => item.装置))).filter(Boolean);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="container mx-auto p-4 pt-20 pl-20 md:pl-40 lg:pl-60">
          <PageHeader title="測定基準値設定" subtitle="記録シートの測定基準値を設定します" />

          <Card className="w-full mt-6">
            <CardContent className="p-4">
              {/* フィルター部分 */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="equipment-filter">装置・部位でフィルター:</Label>
                  <Select onValueChange={filterByEquipment}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="装置を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">すべて表示</SelectItem>
                        {uniqueEquipments.map((equipment) => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* テーブル部分 */}
              {loading ? (
                <div className="text-center p-4">読み込み中...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>装置・部位</TableHead>
                      <TableHead>点検項目</TableHead>
                      <TableHead>測定基準値</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.id || index + 1}</TableCell>
                        <TableCell>{item.装置}</TableCell>
                        <TableCell>{item.点検項目}</TableCell>
                        <TableCell>{item.測定基準値 || '未設定'}</TableCell>
                        <TableCell>
                          <InspectionValueStatus 
                            value={item.測定基準値} 
                            status={item.測定基準値 ? '設定済' : '未設定'} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
}