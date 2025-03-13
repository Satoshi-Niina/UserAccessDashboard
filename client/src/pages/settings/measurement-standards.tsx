import React, { useState, useEffect } from "react";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { InspectionValueStatus } from "@/components/InspectionValueStatus";


export default function MeasurementStandards() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState([]); // Added state for filtering
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
        setFilteredItems(data); // Initialize filteredItems
      } catch (error) {
        console.error("Error fetching inspection items:", error);
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, [toast]);

  const handleValueChange = async (index, value) => {
    try {
      const updatedItems = [...inspectionItems];
      updatedItems[index].measurementValue = value;
      setInspectionItems(updatedItems);
      setFilteredItems(updatedItems); // Update filteredItems

      // APIに保存処理
      await fetch(`/api/inspection-items/${updatedItems[index].id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ measurementValue: value }),
      });
    } catch (error) {
      console.error("Error updating value:", error);
      toast({
        title: "エラー",
        description: "データの更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar defaultExpanded={false} /> {/* Sidebar remains unchanged */}
        <div className={`flex-1 ${isMenuExpanded ? "ml-64" : "ml-20"} p-6 transition-all duration-300`}>
          <PageHeader heading="測定基準値設定" description="点検項目の測定基準値を設定します" />

          <Card className="mt-6">
            <CardContent className="pt-6">
              {loading ? (
                <p>読み込み中...</p>
              ) : filteredItems.length === 0 ? ( // Use filteredItems here
                <p>データがありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">製造メーカー</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">機種</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">エンジン</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">部位</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">装置</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">確認箇所</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">測定基準値</TableHead>
                        <TableHead className="text-xs border border-gray-200 px-2 py-1 bg-gray-50">確認要領</TableHead>
                        <TableHead className="text-sm font-medium border border-gray-200 px-3 py-2 bg-gray-50">値</TableHead>
                        <TableHead className="text-sm font-medium border border-gray-200 px-3 py-2 bg-gray-50">状態</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item, index) => ( // Use filteredItems here
                        <TableRow key={index}>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.manufacturer}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.model}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.engineType}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.category}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.equipment}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.item}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.criteria}</TableCell>
                          <TableCell className="text-xs border border-gray-200 px-2 py-1">{item.method}</TableCell>
                          <TableCell className="border border-gray-200 px-2 py-1">
                            <input
                              type="text"
                              className="border p-1 rounded w-full"
                              placeholder="測定値"
                              value={item.measurementValue || ""} // corrected property name
                              onChange={(e) => handleValueChange(index, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="border border-gray-200 px-2 py-1">
                            <InspectionValueStatus value={item.measurementValue} criteria={item.criteria} /> {/* corrected property name */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
}