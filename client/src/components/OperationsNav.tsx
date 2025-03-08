
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
import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

type OperationsNavProps = {
  currentPage: "inspection" | "operational-plan" | "other";
};

export default function OperationsNav({ currentPage }: OperationsNavProps) {
  const [_, navigate] = useLocation();

  return (
    <div className="flex flex-wrap gap-2 mb-4 w-full">
      <Button
        variant={currentPage === "inspection" ? "default" : "outline"}
        onClick={() => navigate("/operations/inspection")}
        className="flex-1"
      >
        仕業点検
      </Button>
      <Button
        variant={currentPage === "operational-plan" ? "default" : "outline"}
        onClick={() => navigate("/operations/operational-plan")}
        className="flex-1"
      >
        運用計画
      </Button>
    </div>
  );
}
