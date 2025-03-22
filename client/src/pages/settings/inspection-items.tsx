import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Manufacturer {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  manufacturer_id: string;
}

interface InspectionItem {
  id: string;
  manufacturer_id: string;
  model_id: string;
  category: string;
  equipment: string;
  checkPoint: string;
  criteria: string;
  method: string;
}

export default function InspectionItems() {
  const { toast } = useToast();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);

  useEffect(() => {
    // 製造メーカーの取得
    fetch('/api/inspection/table/manufacturers')
      .then(res => res.json())
      .then(data => setManufacturers(data))
      .catch(error => {
        console.error('Error fetching manufacturers:', error);
        toast({
          title: "エラー",
          description: "製造メーカーの取得に失敗しました",
          variant: "destructive"
        });
      });

    // 機種の取得
    fetch('/api/inspection/table/models')
      .then(res => res.json())
      .then(data => setModels(data))
      .catch(error => {
        console.error('Error fetching models:', error);
        toast({
          title: "エラー",
          description: "機種の取得に失敗しました",
          variant: "destructive"
        });
      });

    // 点検項目の取得
    fetch('/api/inspection/table/inspection_items')
      .then(res => res.json())
      .then(data => setInspectionItems(data))
      .catch(error => {
        console.error('Error fetching inspection items:', error);
        toast({
          title: "エラー",
          description: "点検項目の取得に失敗しました",
          variant: "destructive"
        });
      });
  }, []);

  // メーカー選択時の処理
  useEffect(() => {
    if (selectedManufacturer) {
      const filtered = models.filter(model => model.manufacturer_id === selectedManufacturer);
      setFilteredModels(filtered);
      setSelectedModel(''); // 機種の選択をリセット
    } else {
      setFilteredModels(models);
    }
  }, [selectedManufacturer, models]);

  // 表示する点検項目のフィルタリング
  const filteredItems = inspectionItems.filter(item => {
    const manufacturerMatch = !selectedManufacturer || item.manufacturer_id === selectedManufacturer;
    const modelMatch = !selectedModel || item.model_id === selectedModel;
    return manufacturerMatch && modelMatch;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>点検項目管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="w-1/3">
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger>
                <SelectValue placeholder="製造メーカーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                {manufacturers.map(manufacturer => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-1/3">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="機種を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                {filteredModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>カテゴリー</TableHead>
              <TableHead>装置</TableHead>
              <TableHead>確認箇所</TableHead>
              <TableHead>判断基準</TableHead>
              <TableHead>確認要領</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.equipment}</TableCell>
                <TableCell>{item.checkPoint}</TableCell>
                <TableCell>{item.criteria}</TableCell>
                <TableCell>{item.method}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}