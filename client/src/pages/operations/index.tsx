
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Inspection from './inspection';
import OperationalPlan from "./operational-plan";

export default function Operations() {
  const [hasChanges, setHasChanges] = useState(false);

  // 変更があるときに離脱する際の確認
  window.onbeforeunload = hasChanges 
    ? () => "変更が保存されていません。本当に離れますか？" 
    : null;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">運用管理</h1>

      <Tabs defaultValue="inspection">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="inspection">仕業点検</TabsTrigger>
          <TabsTrigger value="operational-plan">運用計画</TabsTrigger>
        </TabsList>

        <TabsContent value="inspection">
          <Inspection onChanges={setHasChanges} />
        </TabsContent>

        <TabsContent value="operational-plan">
          <OperationalPlan />
        </TabsContent>
      </Tabs>
    </div>
  );
}
