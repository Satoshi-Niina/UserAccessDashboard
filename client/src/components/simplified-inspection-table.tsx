
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SimplifiedInspectionItem {
  id: number;
  name: string;
  model?: string;
}

export function SimplifiedInspectionTable() {
  const [items, setItems] = useState<SimplifiedInspectionItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/inspection-items/simplified');
        const data = await response.json();
        setItems(data);
      } catch (error) {
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        });
      }
    };
    fetchItems();
  }, [toast]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名前</TableHead>
          <TableHead>機種</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.model || '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
