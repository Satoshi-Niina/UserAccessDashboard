import React, { useState } from 'react';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';
import { Mic, Send, X } from "lucide-react";
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';

export default function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSearch = async () => {
    if (!inputText.trim()) return;

    try {
      const response = await fetch('/api/tech-support/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputText })
      });

      if (!response.ok) throw new Error('検索に失敗しました');
      const searchResults = await response.json();

      setMessages(prev => [...prev, 
        { content: inputText, isUser: true },
        { 
          content: "検索結果:", 
          isUser: false,
          results: searchResults
        }
      ]);
      setInputText("");
    } catch (error) {
      console.error('検索エラー:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-center">緊急サポート</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.isUser ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t bg-white p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? "destructive" : "secondary"}
                  size="icon"
                  onClick={() => setIsRecording(!isRecording)}
                  className="flex-none"
                >
                  {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="キーワードを入力..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} className="flex-none">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.length > 0 &&
                messages[messages.length - 1].results?.map((result, index) => (
                  <SearchPreview
                    key={index}
                    title={result.title}
                    description={result.description}
                    imagePath={result.image_path}
                    onClick={() => {
                      setSelectedItem(result);
                      setIsDetailOpen(true);
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      </main>

      <DetailView
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedItem?.title}
        description={selectedItem?.description}
        imagePath={selectedItem?.image_path}
      />
    </div>
  );
}