
// 測定基準値設定ページ
// 点検項目の基準値を設定する機能を提供
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler, Edit, Save } from "lucide-react";
import { useState } from "react";

type InspectionItem = {
  id: number;
  name: string;
  columns: Column[];
};

type Column = {
  id: number;
  name: string;
  hasMeasurement: boolean;
  standardValues?: StandardValue;
};

type StandardValue = {
  min?: number;
  max?: number;
  unit: string;
};

// サンプルデータ（実際にはAPIから取得）
const initialItems: InspectionItem[] = [
  {
    id: 1,
    name: "車両本体点検",
    columns: [
      { id: 1, name: "外観", hasMeasurement: false },
      { 
        id: 2, 
        name: "エンジン油量", 
        hasMeasurement: true,
        standardValues: {
          min: 5.0,
          max: 8.0,
          unit: "L"
        }
      },
      { 
        id: 3, 
        name: "タイヤ空気圧", 
        hasMeasurement: true,
        standardValues: {
          min: 2.2,
          max: 2.5,
          unit: "bar"
        }
      }
    ]
  },
  {
    id: 2,
    name: "安全装置点検",
    columns: [
      { id: 4, name: "ライト", hasMeasurement: false },
      { 
        id: 5, 
        name: "ブレーキパッド厚さ", 
        hasMeasurement: true,
        standardValues: {
          min: 3,
          max: 10,
          unit: "mm"
        }
      }
    ]
  }
];

export default function MeasurementStandards() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>(initialItems);
  const [selectedTab, setSelectedTab] = useState("1");
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [tempMinValue, setTempMinValue] = useState<string>("");
  const [tempMaxValue, setTempMaxValue] = useState<string>("");
  const [tempUnit, setTempUnit] = useState<string>("");

  // 基準値の編集を開始
  const startEditing = (column: Column) => {
    setSelectedColumn(column);
    setTempMinValue(column.standardValues?.min?.toString() || "");
    setTempMaxValue(column.standardValues?.max?.toString() || "");
    setTempUnit(column.standardValues?.unit || "");
    setEditMode(true);
  };

  // 基準値の変更を保存
  const saveStandardValues = () => {
    if (!selectedColumn) return;
    
    const min = tempMinValue ? parseFloat(tempMinValue) : undefined;
    const max = tempMaxValue ? parseFloat(tempMaxValue) : undefined;
    
    const updatedColumn: Column = {
      ...selectedColumn,
      hasMeasurement: true,
      standardValues: {
        min,
        max,
        unit: tempUnit
      }
    };
    
    // 更新された項目を保存
    const updatedItems = items.map(item => {
      const updatedColumns = item.columns.map(col => 
        col.id === selectedColumn.id ? updatedColumn : col
      );
      
      return {
        ...item,
        columns: updatedColumns
      };
    });
    
    setItems(updatedItems);
    setEditMode(false);
    setSelectedColumn(null);
  };

  // 測定項目のみを表示
  const getMeasurementColumns = (itemId: number) => {
    const item = items.find(i => i.id.toString() === itemId.toString());
    if (!item) return [];
    
    return item.columns.filter(col => col.hasMeasurement);
  };

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <h1 className="text-3xl font-bold mb-6">測定基準値設定</h1>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              {items.map(item => (
                <TabsTrigger key={item.id} value={item.id.toString()}>
                  {item.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {items.map(item => (
              <TabsContent key={item.id} value={item.id.toString()}>
                <Card>
                  <CardHeader>
                    <CardTitle>{item.name}の測定基準値</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getMeasurementColumns(item.id).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>項目</TableHead>
                            <TableHead>最小値</TableHead>
                            <TableHead>最大値</TableHead>
                            <TableHead>単位</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getMeasurementColumns(item.id).map(column => (
                            <TableRow key={column.id}>
                              <TableCell>{column.name}</TableCell>
                              <TableCell>
                                {editMode && selectedColumn?.id === column.id ? (
                                  <Input
                                    type="number"
                                    value={tempMinValue}
                                    onChange={(e) => setTempMinValue(e.target.value)}
                                    placeholder="最小値"
                                    className="w-24"
                                  />
                                ) : (
                                  column.standardValues?.min || "-"
                                )}
                              </TableCell>
                              <TableCell>
                                {editMode && selectedColumn?.id === column.id ? (
                                  <Input
                                    type="number"
                                    value={tempMaxValue}
                                    onChange={(e) => setTempMaxValue(e.target.value)}
                                    placeholder="最大値"
                                    className="w-24"
                                  />
                                ) : (
                                  column.standardValues?.max || "-"
                                )}
                              </TableCell>
                              <TableCell>
                                {editMode && selectedColumn?.id === column.id ? (
                                  <Select value={tempUnit} onValueChange={setTempUnit}>
                                    <SelectTrigger className="w-20">
                                      <SelectValue placeholder="単位" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="mm">mm</SelectItem>
                                      <SelectItem value="cm">cm</SelectItem>
                                      <SelectItem value="m">m</SelectItem>
                                      <SelectItem value="L">L</SelectItem>
                                      <SelectItem value="kg">kg</SelectItem>
                                      <SelectItem value="°C">°C</SelectItem>
                                      <SelectItem value="bar">bar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  column.standardValues?.unit || "-"
                                )}
                              </TableCell>
                              <TableCell>
                                {editMode && selectedColumn?.id === column.id ? (
                                  <Button variant="default" size="sm" onClick={saveStandardValues}>
                                    <Save className="h-4 w-4 mr-1" />
                                    保存
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => startEditing(column)}
                                    disabled={editMode}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    編集
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <Ruler className="h-10 w-10 text-muted-foreground mb-4" />
                        <p>測定が必要な項目がありません</p>
                        <p className="text-sm text-muted-foreground">
                          点検項目編集画面で測定項目を追加してください
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
