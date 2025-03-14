
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ExitButton } from '@/components/layout/exit-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import OperationsNav from '@/components/operations/nav';

interface PlanningFormData {
  manufacturer: string;
  model: string;
  engineType: string;
  category: string;
  equipment: string;
  item: string;
  criteria: string;
  method: string;
  measurementRecord: string;
  diagramRecord: string;
}

export default function PlanningPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<PlanningFormData>({
    manufacturer: '',
    model: '',
    engineType: '',
    category: '',
    equipment: '',
    item: '',
    criteria: '',
    method: '',
    measurementRecord: '',
    diagramRecord: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/save-inspection-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [formData],
          fileName: `作業計画_${new Date().toISOString().slice(0, 10)}.csv`
        }),
      });

      if (!response.ok) throw new Error('保存に失敗しました');

      toast({
        title: "保存完了",
        description: "作業計画を保存しました",
      });
      
      navigate('/operations');
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">作業計画</h1>
        <ExitButton
          hasChanges={hasChanges}
          onSave={handleSave}
          redirectTo="/operations"
        />
      </div>

      <OperationsNav currentPage="planning" />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>作業計画フォーム</CardTitle>
          <CardDescription>作業計画の詳細を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">製造メーカー</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">機種</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineType">エンジン型式</Label>
                <Input
                  id="engineType"
                  value={formData.engineType}
                  onChange={(e) => setFormData({...formData, engineType: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">部位</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">装置</Label>
                <Input
                  id="equipment"
                  value={formData.equipment}
                  onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item">確認箇所</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => setFormData({...formData, item: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="criteria">判断基準</Label>
                <Input
                  id="criteria"
                  value={formData.criteria}
                  onChange={(e) => setFormData({...formData, criteria: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">確認要領</Label>
                <Input
                  id="method"
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurementRecord">測定等記録</Label>
                <Input
                  id="measurementRecord"
                  value={formData.measurementRecord}
                  onChange={(e) => setFormData({...formData, measurementRecord: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagramRecord">図形記録</Label>
                <Input
                  id="diagramRecord"
                  value={formData.diagramRecord}
                  onChange={(e) => setFormData({...formData, diagramRecord: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="submit">
                保存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
