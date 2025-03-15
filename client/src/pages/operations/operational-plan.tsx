
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import OperationsNav from "@/components/OperationsNav";

export default function OperationalPlan() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    vehicleType: '',
    operationSection: '',
    startTime: '',
    endTime: '',
    purpose: '',
    responsible: '',
    operator: '',
    remarks: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    // Load last saved record from localStorage
    const savedData = localStorage.getItem('operationalPlanData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setFormData(data.formData);
      setRecordId(data.recordId);
    }
  }, []);

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
          fileName: `運用計画_${formData.date}.csv`,
          recordId: recordId || new Date().toISOString(), // 新規の場合は現在時刻をIDとして使用
          isUpdate: !!recordId // recordIdが存在する場合のみ上書き
        }),
      });

      if (!response.ok) throw new Error('保存に失敗しました');

      const result = await response.json();
      
      // Save form data and record ID to localStorage
      localStorage.setItem('operationalPlanData', JSON.stringify({
        formData,
        recordId: result.recordId
      }));

      toast({
        title: "保存完了",
        description: "運用計画を保存しました",
      });
      setIsSaved(true);
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate("/operations/inspection")}>仕業点検</Button>
        <div className="text-center font-bold">運用計画</div>
        <Button variant="ghost" onClick={() => navigate("/operations")}>戻る</Button>
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-lg font-bold mb-4">運用計画フォーム</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">運用日</Label>
                <Input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">車両番号</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleType">車種</Label>
                <Input
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operationSection">運転区間</Label>
                <Input
                  id="operationSection"
                  value={formData.operationSection}
                  onChange={(e) => setFormData({...formData, operationSection: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">開始時刻</Label>
                <Input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">終了時刻</Label>
                <Input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="purpose">作業目的</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">責任者</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">運転士</Label>
                <Input
                  id="operator"
                  value={formData.operator}
                  onChange={(e) => setFormData({...formData, operator: e.target.value})}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="remarks">備考</Label>
                <Input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => navigate("/operations")}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaved}>
                登録
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
