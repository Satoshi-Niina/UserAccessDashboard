import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, X, XCircle } from "lucide-react";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { useState } from "react";
import { useLocation } from "wouter";

type ChatMessage = {
  content: string;
  isUser: boolean;
  image?: string;
};

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [, setLocation] = useLocation();

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: 音声認識の実装
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: 音声認識の停止処理
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    // TODO: AIの応答を実装
    // 仮の応答
    setTimeout(() => {
      setMessages(prev => [...prev, {
        content: "検索結果",
        isUser: false,
        image: "https://example.com/test-image.jpg"
      }]);
    }, 1000);

    setInputText("");
  };

  const handleClear = () => {
    setInputText("");
  };

  const handleExit = () => {
    setLocation("/");
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 ml-12 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">音声アシスタント</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExit}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        <Card className="h-[calc(100vh-12rem)]">
          <CardContent className="flex flex-col h-full p-6">
            {/* チャットエリア - AIの応答と画像のみを表示 */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                !message.isUser && (
                  <ChatBubble
                    key={index}
                    content={message.content}
                    isUser={false}
                    image={message.image}
                  />
                )
              ))}
            </div>

            {/* 入力エリア */}
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="icon"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                disabled={!inputText}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handleSend} disabled={!inputText}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}