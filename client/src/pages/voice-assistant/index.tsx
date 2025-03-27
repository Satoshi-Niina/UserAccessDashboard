
import React, { useState, useEffect } from 'react';
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import Fuse from 'fuse.js';
import { Mic, Send, X } from "lucide-react";

type SearchResult = {
  content: string;
  type: 'text' | 'image';
  source: string;
};

type ChatMessage = {
  content: string;
  isUser: boolean;
  results?: SearchResult[];
};

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [searchData, setSearchData] = useState<any[]>([]);
  const [fuse, setFuse] = useState<Fuse<any>>();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/tech-support/search-data');
        const data = await response.json();
        setSearchData(data);
        
        const fuseOptions = {
          keys: ['title', 'description', 'content'],
          threshold: 0.4,
          includeMatches: true
        };
        setFuse(new Fuse(data, fuseOptions));
      } catch (error) {
        console.error('Error loading search data:', error);
      }
    };
    loadData();
  }, []);

  const handleSearch = () => {
    if (!inputText.trim() || !fuse) return;

    const results = fuse.search(inputText);
    const searchResults: SearchResult[] = results.map(result => ({
      content: result.item.title,
      type: result.item.type,
      source: result.item.source
    }));

    setMessages(prev => [...prev, 
      { content: inputText, isUser: true },
      { 
        content: "検索結果:", 
        isUser: false,
        results: searchResults
      }
    ]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto px-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold">緊急サポート</h1>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
        <div className="grid grid-cols-2 h-full">
          <div className="p-4 border-r overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-100 ml-auto max-w-[80%]'
                      : 'bg-gray-100 max-w-[80%]'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            <div className="grid gap-4">
              {messages.length > 0 &&
                messages[messages.length - 1].results?.map((result, index) => (
                  <SearchPreview
                    key={index}
                    title={result.content}
                    description="詳細を表示するにはクリックしてください"
                    imagePath={result.source}
                    onClick={() => {
                      setSelectedItem({
                        title: result.content,
                        description: "詳細説明",
                        imagePath: result.source,
                      });
                      setIsDetailOpen(true);
                    }}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
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
            />
            <Button onClick={handleSearch} className="flex-none">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DetailView
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedItem?.title}
        description={selectedItem?.description}
        imagePath={selectedItem?.imagePath}
      />
    </div>
  );
}
