
import React, { useState, useEffect } from 'react';
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold text-center py-4">緊急サポート</h1>
      
      <div className="flex flex-1 overflow-hidden">
        {/* 左側のチャットエリア */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 ${msg.isUser ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg ${msg.isUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 右側のプレビューエリア */}
        <div className="w-1/2 p-4 border-l">
          <div className="grid gap-4">
            {messages.map((msg, idx) => 
              msg.results?.map((result, resultIdx) => (
                <SearchPreview
                  key={`${idx}-${resultIdx}`}
                  title={result.content}
                  description="詳細を表示するにはクリックしてください"
                  imagePath={result.source}
                  onClick={() => {
                    setSelectedItem(result);
                    setIsDetailOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <DetailView
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedItem.content}
          description={selectedItem.content}
          imagePath={selectedItem.source}
        />
      )}
    </div>
  );
}
