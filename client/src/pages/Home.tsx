import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [location, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">ホーム</h1>
        <div className="space-y-4">
          <Button onClick={() => setLocation('/operations')}>
            運用管理へ
          </Button>
        </div>
      </Card>
    </div>
  );
}