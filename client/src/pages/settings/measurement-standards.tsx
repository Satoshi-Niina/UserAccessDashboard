import React, { useState, useEffect } from "react";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { InspectionValueStatus } from "@/components/InspectionValueStatus";
import { Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@radix-ui/react-select'


export default function MeasurementStandards() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(true); // Always expanded
  const [inspectionItems, setInspectionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState([]);
  const [availableFiles, setAvailableFiles] = useState([]); // Add state for available files
  const [selectedFile, setSelectedFile] = useState(''); // Add state for selected file
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

        //Simulate fetching available files - replace with actual API call if needed.
        setAvailableFiles([
          {name: 'file1.csv'},
          {name: 'file2.csv'},
          {name: 'file3.csv'}
        ]);

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
      setFilteredItems(updatedItems);

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
        <Sidebar defaultExpanded={true} /> {/* サイドバーを常に展開 */}
        <div className={`flex-1 ${isMenuExpanded ? "ml-64" : "ml-20"} p-6 transition-all duration-300`}>
          <PageHeader title="測定等基準値" description="各点検項目の測定基準値を管理します" />

          <Card className="mt-4 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-1/2">
                  <Label htmlFor="csv-file">仕業点検項目ファイル</Label>
                  <Select value={selectedFile} onValueChange={(value) => setSelectedFile(value)}>
                    <SelectTrigger id="csv-file">
                      <SelectValue placeholder="ファイルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableFiles.map((file) => (
                          <SelectItem key={file.name} value={file.name}>
                            {file.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-4">
              {loading ? (
                <div className="text-center py-4">データを読み込み中...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="border-collapse w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">製造メーカー</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">機種</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">部位</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">装置</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">確認箇所</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">判断基準</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">確認要領</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">測定等記録</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">測定値</TableHead>
                        <TableHead className="border border-gray-200 px-2 py-1 font-semibold text-xs">状態</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center border border-gray-200 py-4">
                            データがありません
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.manufacturer}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.model}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.category}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.equipment}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.item}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.criteria}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.method}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1 text-sm">{item.measurementRecord}</TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1">
                              <input
                                type="text"
                                className="border p-1 rounded w-full"
                                placeholder="測定値"
                                value={item.measurementValue || ""}
                                onChange={(e) => handleValueChange(index, e.target.value)}
                              />
                            </TableCell>
                            <TableCell className="border border-gray-200 px-2 py-1">
                              <InspectionValueStatus value={item.measurementValue} criteria={item.criteria} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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