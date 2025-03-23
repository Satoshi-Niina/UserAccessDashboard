import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TableData {
  headers: string[];
  rows: Record<string, string>[];
}

export default function TableEditor() {
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tableData, setTableData] = useState<TableData>({ headers: [], rows: [] });
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const response = await fetch('/api/inspection/table/manufacturers');
        const data = await response.json();
        setManufacturers(data.map(item => item.manufacturer)); // Assuming CSV structure
      } catch (error) {
        console.error('Error fetching manufacturers:', error);
        toast({ title: "Error", description: "Failed to fetch manufacturers", variant: "destructive" });
      }
    };

    const fetchModels = async () => {
      try {
        const response = await fetch('/api/inspection/table/models');
        const data = await response.json();
        setModels(data.map(item => item.model)); // Assuming CSV structure
      } catch (error) {
        console.error('Error fetching models:', error);
        toast({ title: "Error", description: "Failed to fetch models", variant: "destructive" });
      }
    };
    fetchManufacturers();
    fetchModels();
  }, []);

  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        let url = '/api/inspection/table/inspection_items';
        if (selectedManufacturer) {
          url += `?manufacturer=${selectedManufacturer}`;
        }
        if (selectedModel) {
          url += `&model=${selectedModel}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setTableData({ headers: Object.keys(data[0]), rows: data });
      } catch (error) {
        console.error('Error fetching inspection items:', error);
        toast({ title: "Error", description: "Failed to fetch inspection items", variant: "destructive" });
      }
    }

    if (selectedManufacturer || selectedModel) {
      fetchInspectionItems();
    }
  }, [selectedManufacturer, selectedModel]);


  const handleSave = async () => {
    //Implementation for saving data to the backend, similar to original
    try {
      const response = await fetch(`/api/inspection/table/inspection_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: tableData.rows }),
      });
      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }
      toast({ title: "成功", description: "データを保存しました" });
    } catch (error) {
      toast({ title: "エラー", description: "データの保存に失敗しました", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>テーブル編集</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger>
                <SelectValue placeholder="製造メーカーを選択" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="機種を選択" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tableData.headers.length > 0 && (
            <>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableData.headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                      {/*Removed 操作 column*/}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {tableData.headers.map((header, colIndex) => (
                          <TableCell key={colIndex}>
                            <Input
                              value={row[header] || ''}
                              onChange={(e) => {
                                const newRows = [...tableData.rows];
                                newRows[rowIndex] = { ...newRows[rowIndex], [header]: e.target.value };
                                setTableData({ ...tableData, rows: newRows });
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button onClick={handleSave}>保存</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}