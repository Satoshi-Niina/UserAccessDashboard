
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function OperationsNav() {
  const [_, navigate] = useLocation();

  return (
    <div className="flex space-x-4 mb-6">
      <Button 
        variant="outline" 
        onClick={() => navigate("/operations/inspection")}
        className="flex-1"
      >
        仕業点検
      </Button>
      <Button 
        variant="outline"
        onClick={() => navigate("/operations/operational-plan")}
        className="flex-1"
      >
        運用計画
      </Button>
      <Button 
        variant="outline"
        onClick={() => navigate("/operations")}
        className="flex-1"
      >
        運用管理トップ
      </Button>
    </div>
  );
}
