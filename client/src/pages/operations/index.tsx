import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from "@/components/layout/sidebar";
import { ExitButton } from "@/components/layout/exit-button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from '@/components/ui';
import Inspection from './inspection';

export default function Operations() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('inspection');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  // URLからタブを取得
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">運用管理</h1>
            <ExitButton />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="operational">運用実績</TabsTrigger>
            </TabsList>
            <TabsContent value="inspection" className="mt-6">
              <Inspection />
            </TabsContent>
            <TabsContent value="operational" className="mt-6">
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold mb-4">運用実績管理</h2>
                <p className="text-muted-foreground">運用実績の記録と管理画面（開発中）</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}on />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="inspection">仕業点検</TabsTrigger>
              <TabsTrigger value="engine-hours">運用実績</TabsTrigger>
            </TabsList>
            <TabsContent value="inspection">
              <Inspection />
            </TabsContent>
            <TabsContent value="engine-hours">
              <div className="p-4 border rounded-md mt-4">
                <h2 className="text-xl font-semibold mb-4">運用実績</h2>
                <p>エンジンアワーの記録はここに表示されます。</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}