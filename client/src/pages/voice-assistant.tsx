import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, X, XCircle } from "lucide-react";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { useState } from "react";
import { useLocation } from "wouter";
import axios from 'axios';
import { handleStartRecording, handleStopRecording, handleSend, handleClear, handleExit } from "@/utils/voice-assistant";

type ChatMessage = {
  content: string;
  isUser: boolean;
  image?: string;
};

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="flex h-screen">
      <Sidebar onExpandChange={setIsMenuExpanded} />
      {/* メインコンテンツをサイドバーの幅に合わせて動的に調整 */}
      <div className={`flex-1 ${isMenuExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">音声アシスタント</h1>
            <Button
              variant="destructive"
              onClick={() => handleExit(setLocation)}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              音声アシスタント終了
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
                  onClick={isRecording ? () => handleStopRecording(setIsRecording) : () => handleStartRecording(setIsRecording, setInputText)}
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
                  onClick={() => handleClear(setInputText)}
                  disabled={!inputText}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={() => handleSend(inputText, setMessages, setInputText)} disabled={!inputText}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}