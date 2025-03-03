import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
import Inspection from './inspection';

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
          <TabsTrigger value="operational-plan">運行計画</TabsTrigger>
        </TabsList>

        <TabsContent value="inspection">
          <Inspection onChanges={setHasChanges} />
        </TabsContent>

        <TabsContent value="operational-plan">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">運行計画</h2>
            <p>運行計画機能は開発中です。</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}