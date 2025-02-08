import { Sidebar } from "@/components/layout/sidebar";
import { Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function VoiceAssistant() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">音声Assistant</h1>
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Mic className="h-16 w-16 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                AIを活用した音声認識により、効率的な業務サポートを提供します。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
