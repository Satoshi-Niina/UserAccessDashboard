
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from '@/components/ui';
import { Settings } from 'lucide-react';

export default function MachineInspection() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">このページは削除されました</h1>
        <p className="text-muted-foreground mb-8">点検システムの機能は設定メニューから利用できます</p>
        <Button onClick={() => navigate("/settings/inspection-items")}>
          <Settings className="mr-2 h-4 w-4" />
          設定ページへ移動
        </Button>
      </div>
    </div>
  );
}
