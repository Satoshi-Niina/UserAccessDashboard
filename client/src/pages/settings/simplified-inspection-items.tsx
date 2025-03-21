// This file needs to be created at "@/hooks/use-toast.ts"
import { useState } from 'react';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToasts([...toasts, { message, type }]);
  };

  const hideToast = (index: number) => {
    setToasts(toasts.filter((_, i) => i !== index));
  };

  return { toasts, showToast, hideToast };
};


// This file is  "@/components/simplified-inspection-items.tsx"
import { useState, useEffect } from 'react';
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

export default function SimplifiedInspectionItems() {
  const [items, setItems] = useState<SimplifiedInspectionItem[]>([]);
  const { toast } = useToast(); //This line was updated.

  useEffect(() => {
    // Fetch data here...  (Implementation omitted as it's outside the scope of the problem)
    const sampleData = [
      { id: 1, name: 'Item 1', description: 'Description 1' },
      { id: 2, name: 'Item 2', description: 'Description 2' },
    ];
    setItems(sampleData);
  }, []);

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
}