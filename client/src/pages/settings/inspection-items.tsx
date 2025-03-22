import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

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
  name: string;
  model_id: string;
}

export default function InspectionItems() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Load manufacturers
    fetch('/api/manufacturers')
      .then(res => res.json())
      .then(data => setManufacturers(data))
      .catch(error => {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "製造メーカーの読み込みに失敗しました",
        });
      });
  }, []);

  useEffect(() => {
    if (selectedManufacturer) {
      // Load models for selected manufacturer
      fetch(`/api/models?manufacturer_id=${selectedManufacturer}`)
        .then(res => res.json())
        .then(data => setModels(data))
        .catch(error => {
          toast({
            variant: "destructive",
            title: "エラー",
            description: "機種の読み込みに失敗しました",
          });
        });
    }
  }, [selectedManufacturer]);

  useEffect(() => {
    if (selectedModel) {
      // Load inspection items for selected model
      fetch(`/api/inspection-items?model_id=${selectedModel}`)
        .then(res => res.json())
        .then(data => setInspectionItems(data))
        .catch(error => {
          toast({
            variant: "destructive",
            title: "エラー",
            description: "点検項目の読み込みに失敗しました",
          });
        });
    }
  }, [selectedModel]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>点検項目管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">製造メーカー</Label>
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="メーカーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">機種</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="機種を選択" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
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
                <TableHead>項目名</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspectionItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {/* Add edit/delete buttons here if needed */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}