
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [value, setValue] = useState('');
  const [location, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">ホーム</h1>
        <div className="space-y-4">
          <Input 
            type="text" 
            value={value} 
            onChange={e => setValue(e.target.value)}
            placeholder="検索..."
          />
          <Button onClick={() => setLocation('/operations')}>
            運用管理へ
          </Button>
        </div>
      </Card>
    </div>
  );
}
