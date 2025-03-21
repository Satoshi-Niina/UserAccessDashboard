
import React from 'react';
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
  description: string;
}

const SimplifiedInspectionItems: React.FC = () => {
  const [items, setItems] = React.useState<SimplifiedInspectionItem[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/inspection-items/simplified');
        if (!response.ok) throw new Error('Failed to fetch items');
        const data = await response.json();
        setItems(data);
      } catch (error) {
        toast({
          title: "エラー",
          description: "項目の読み込みに失敗しました",
          variant: "destructive"
        });
      }
    };
    
    fetchItems();
  }, [toast]);

  return (
    <div className="container mx-auto py-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>説明</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SimplifiedInspectionItems;
