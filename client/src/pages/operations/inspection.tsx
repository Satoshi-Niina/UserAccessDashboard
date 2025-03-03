import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface InspectionItem {
  id: string;
  category: string;
  item_name: string;
  inspection_method: string;
}

export default function InspectionPage() {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectionResults, setInspectionResults] = useState<
    Record<string, string>
  >({});
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchInspectionItems = async () => {
      try {
        const response = await axios.get("/api/inspection-items");
        setInspectionItems(response.data);

        // Initialize results with empty values
        const initialResults: Record<string, string> = {};
        response.data.forEach((item: InspectionItem) => {
          initialResults[item.id] = "";
        });
        setInspectionResults(initialResults);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching inspection items:", error);
        setLoading(false);
      }
    };

    fetchInspectionItems();
  }, []);

  const handleResultChange = (itemId: string, result: string) => {
    setInspectionResults((prev) => ({
      ...prev,
      [itemId]: result,
    }));
  };

  const handleSubmit = async () => {
    if (!vehicle || !date) {
      alert("車両番号と日付を入力してください");
      return;
    }

    // Check if all items have been inspected
    const allInspected = Object.values(inspectionResults).every(
      (result) => result !== "",
    );
    if (!allInspected) {
      alert("すべての項目を点検してください");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/inspections", {
        vehicle,
        date,
        results: inspectionResults,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting inspection:", error);
      alert("点検記録の送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">点検項目を読み込み中...</span>
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">点検完了</h2>
            <p className="text-gray-600 mb-6">点検結果が正常に記録されました</p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setVehicle("");
                setDate("");
                // Reset results
                const resetResults: Record<string, string> = {};
                inspectionItems.forEach((item) => {
                  resetResults[item.id] = "";
                });
                setInspectionResults(resetResults);
              }}
            >
              新しい点検を開始
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>仕業点検</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="w-1/2">
              <Label htmlFor="vehicle">車両番号</Label>
              <Input
                id="vehicle"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="車両番号を入力"
                className="mt-1"
              />
            </div>
            <div className="w-1/2">
              <Label htmlFor="date">点検日</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inspectionItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{item.item_name}</h3>
                <p className="text-sm text-gray-500">
                  カテゴリ: {item.category}
                </p>
                <p className="text-sm text-gray-500">
                  点検方法: {item.inspection_method}
                </p>
              </div>
              <div className="mt-4">
                <Label htmlFor={`result-${item.id}`}>点検結果</Label>
                <Select
                  value={inspectionResults[item.id]}
                  onValueChange={(value) => handleResultChange(item.id, value)}
                >
                  <SelectTrigger
                    className="w-full mt-1"
                    id={`result-${item.id}`}
                  >
                    <SelectValue placeholder="結果を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">正常</SelectItem>
                    <SelectItem value="ng">異常あり</SelectItem>
                    <SelectItem value="na">該当なし</SelectItem>
                  </SelectContent>
                </Select>
                {inspectionResults[item.id] === "ng" && (
                  <div className="mt-2 flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <p className="text-sm text-red-500">
                      異常が見つかりました。管理者に報告してください。
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} className="px-6">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            "点検結果を送信"
          )}
        </Button>
      </div>
    </div>
  );
}
