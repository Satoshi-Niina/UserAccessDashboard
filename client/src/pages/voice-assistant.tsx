import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, X } from "lucide-react";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { useState } from "react";

type ChatMessage = {
  content: string;
  isUser: boolean;
  image?: string;
};

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

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

    // ユーザーのメッセージを追加
    setMessages([...messages, { content: inputText, isUser: true }]);

    // TODO: AIの応答を実装
    // 仮の応答
    setTimeout(() => {
      setMessages(prev => [...prev, {
        content: "応答テスト",
        isUser: false,
        image: "https://example.com/test-image.jpg"
      }]);
    }, 1000);

    setInputText("");
  };

  const handleClear = () => {
    setInputText("");
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">音声アシスタント</h1>
        <Card className="h-[calc(100vh-12rem)]">
          <CardContent className="flex flex-col h-full p-6">
            {/* チャットエリア */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <ChatBubble
                  key={index}
                  content={message.content}
                  isUser={message.isUser}
                  image={message.image}
                />
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