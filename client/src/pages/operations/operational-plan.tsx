import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OperationsNav from "@/components/OperationsNav";

export default function OperationalPlan() {
  const [location] = useLocation();

  return (
    <div className="container mx-auto p-4">
      <OperationsNav currentPage="operational-plan" />

      <Card>
        <CardHeader>
          <CardTitle>運用計画フォーム</CardTitle>
        </CardHeader>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList>
            <TabsTrigger value="daily">日次計画</TabsTrigger>
            <TabsTrigger value="weekly">週次計画</TabsTrigger>
            <TabsTrigger value="monthly">月次計画</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            {/* 日次計画のコンテンツ */}
          </TabsContent>

          <TabsContent value="weekly">
            {/* 週次計画のコンテンツ */}
          </TabsContent>

          <TabsContent value="monthly">
            {/* 月次計画のコンテンツ */}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}