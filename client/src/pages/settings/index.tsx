import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSettings } from "./user-settings";
import { Button } from "@/components/ui/button";
import { MapPin, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth";
import TechSupportData from "./tech-support-data";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold text-secondary-foreground border-b pb-2">設定</h1>
      <Tabs defaultValue="tech-support-data">
        <TabsList className="mb-4">
          <TabsTrigger value="tech-support-data">技術支援データ処理</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="user">ユーザー設定</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="tech-support-data">
          <TechSupportData />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="user">
            <UserSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}