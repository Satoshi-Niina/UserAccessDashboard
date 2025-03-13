import React, { useState, useEffect, createContext, useContext } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { InspectionValueStatus } from "@/components/InspectionValueStatus";

const SidebarContext = createContext(null);

const SidebarProvider = ({ children }) => {
  //Example Sidebar context value. Replace with your actual context.
  const sidebarContextValue = { isOpen: false, setIsOpen: () => {} };
  return <SidebarContext.Provider value={sidebarContextValue}>{children}</SidebarContext.Provider>;
};

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
};


export default function MeasurementStandards() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
        <Sidebar onExpandChange={setIsMenuExpanded} />
        <div className={`flex-1 ${isMenuExpanded ? "ml-64" : "ml-20"} p-6 transition-all duration-300`}>
          <PageHeader heading="測定基準値設定" description="点検項目の測定基準値を設定します" />

          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-4">読み込み中...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>機種</TableHead>
                      <TableHead>装置</TableHead>
                      <TableHead>確認箇所</TableHead>
                      <TableHead>判断基準</TableHead>
                      <TableHead>確認要領</TableHead>
                      <TableHead>測定等記録</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.modelName}</TableCell>
                        <TableCell>{item.deviceName}</TableCell>
                        <TableCell>{item.checkPoint}</TableCell>
                        <TableCell>{item.judgementCriteria}</TableCell>
                        <TableCell>{item.checkMethod}</TableCell>
                        <TableCell>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={item.measurementValue || ""}
                            onChange={(e) => handleValueChange(index, e.target.value)}
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