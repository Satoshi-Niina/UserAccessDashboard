
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Fuse from 'fuse.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    // Load JSON and image data
    const loadData = async () => {
      try {
        const response = await fetch('/api/tech-support/search-data');
        const data = await response.json();
        setSearchData(data);
        
        // Initialize Fuse instance
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
    <div className="container mx-auto p-6">
      <div className="flex flex-col h-[80vh]">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-[70%] ${message.isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                <p>{message.content}</p>
                {message.results && (
                  <div className="mt-2 space-y-2">
                    {message.results.map((result, idx) => (
                      <div key={idx} className="border rounded p-2">
                        <p>{result.content}</p>
                        {result.type === 'image' && (
                          <img src={result.source} alt={result.content} className="mt-2 max-w-full h-auto"/>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="検索したいキーワードを入力..."
            className="flex-1"
          />
          <Button onClick={handleSearch}>
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
