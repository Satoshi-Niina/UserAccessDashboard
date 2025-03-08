
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// バリデーションスキーマ
const planFormSchema = z.object({
  planDate: z.date({
    required_error: "運用日を選択してください",
  }),
  vehicleId: z.string().min(1, "車両を選択してください"),
  vehicleType: z.string().min(1, "車両型式を選択してください"),
  route: z.string().min(1, "運用区間を入力してください"),
  plannedStartTime: z.string().min(1, "予定出発時刻を入力してください"),
  plannedEndTime: z.string().min(1, "予定終了時刻を入力してください"),
  purpose: z.string().min(1, "作業目的を入力してください"),
  driverName: z.string().min(1, "運転手名を入力してください"),
  supportStaffName: z.string().optional(),
  remarks: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function OperationalPlanPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("operational-plan");

  // タブ切り替え処理
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "inspection") {
      navigate("/operations/inspection");
    } else if (value === "operational-plan") {
      // 現在のページなので特に遷移不要
    }
  };

  // デフォルト値の設定
  const defaultValues: Partial<PlanFormValues> = {
    planDate: new Date(),
    vehicleId: "",
    vehicleType: "",
    route: "",
    plannedStartTime: "",
    plannedEndTime: "",
    purpose: "",
    driverName: "",
    supportStaffName: "",
    remarks: "",
  };

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues,
  });

  function onSubmit(data: PlanFormValues) {
    console.log(data);
    toast({
      title: "運用計画が登録されました",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <div className="container mx-auto py-8">
      {/* タブUIを一番上に配置 */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inspection">仕業点検</TabsTrigger>
          <TabsTrigger value="operational-plan">運用計画</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 運用計画フォーム */}
      <h1 className="text-2xl font-bold mb-6">運用計画登録</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>運用計画フォーム</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 運用日 */}
                <FormField
                  control={form.control}
                  name="planDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">運用日</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy年MM月dd日", { locale: ja })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ja}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 車両ID */}
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>車両番号</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="車両を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MC300-1">MC300-1</SelectItem>
                          <SelectItem value="MC300-2">MC300-2</SelectItem>
                          <SelectItem value="MC300-3">MC300-3</SelectItem>
                          <SelectItem value="MR400-1">MR400-1</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 車両型式 */}
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>車両型式</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="型式を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MC300">MC300</SelectItem>
                          <SelectItem value="MR400">MR400</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 運用区間 */}
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>運用区間</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 東京駅〜新宿駅" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 予定出発時刻 */}
                <FormField
                  control={form.control}
                  name="plannedStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>予定出発時刻</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 予定終了時刻 */}
                <FormField
                  control={form.control}
                  name="plannedEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>予定終了時刻</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 作業目的 */}
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>作業目的</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="作業目的を入力" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 運転手名 */}
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>運転手</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="運転手名を入力" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 添乗員名 */}
                <FormField
                  control={form.control}
                  name="supportStaffName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>添乗員（任意）</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="添乗員名を入力" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 備考 */}
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>備考（任意）</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="備考事項があれば入力してください" 
                          className="resize-none" 
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline">キャンセル</Button>
                <Button type="submit">登録</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
