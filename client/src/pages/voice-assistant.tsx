import { useState, useEffect, useRef } from "react";
import Fuse from 'fuse.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, X, Pause, StopCircle, Play, UploadCloud, Circle } from "lucide-react";

// 型定義
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
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [searchData, setSearchData] = useState<any[]>([]);
  const [fuse, setFuse] = useState<Fuse<any>>();
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const endpoint = import.meta.env.VITE_API_ENDPOINT || '/api/tech-support/search-data';
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }
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

  useEffect(() => {
    if (mode) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  const startMic = async () => {
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const transcript = result[0].transcript;
          setMessages(prevMessages => [...prevMessages, { content: transcript, isUser: true }]);
        }
      };

      recognition.start();
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 マイクが起動しました");
      setIsRecording(true);
    } catch (err) {
      console.error("マイクの起動に失敗しました", err);
    }
  };

  const stopMic = () => {
    setIsRecording(false);
    console.log("🎤 マイクを停止しました");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;
      console.log("📷 カメラが起動しました");
    } catch (err) {
      console.error("カメラの起動に失敗しました", err);
    }
  };

  const stopCamera = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    console.log("📷 カメラを停止しました");
  };

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
        { content: "検索結果:", isUser: false, results: searchResults }
      ]);
      setInputText("");
    } catch (error) {
      console.error('検索エラー:', error);
      setMessages(prev => [...prev,
        { content: inputText, isUser: true },
        { content: "検索中にエラーが発生しました。", isUser: false }
      ]);
    }
  };

  const handleCapture = (action: string) => {
    if (mode === 'photo') {
      if (action === 'start') {
        console.log('📸 写真を撮影しました');
      }
    } else {
      console.log(`🎥 動画アクション: ${action}`);
    }
  };

  const handleUploadToServer = () => {
    alert('チャット履歴及び画像を送信します');
    console.log('サーバーへファイル送信');
  };

  return (
    <div className="container mx-auto p-4 relative">
      <h1 className="text-center text-xl font-bold mb-4">緊急サポート</h1>

      <Button
        variant="outline"
        className="absolute top-2 right-2 rounded-full shadow px-3 py-1 text-sm"
        onClick={() => window.location.href = '/'}
      >
        終了
      </Button>

      <div className="flex flex-col h-[60vh] border border-blue-400 rounded-lg p-4 overflow-hidden mb-6">
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.isUser ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`rounded-lg p-3 max-w-[60%] ${
                    message.isUser 
                      ? 'bg-blue-500 text-white cursor-pointer' 
                      : 'bg-gray-100'
                  }`}
                  onClick={() => {
                    if (message.isUser) {
                      setInputText(message.content);
                    }
                  }}
                >
                  <p>{message.content}</p>
                  {!message.isUser && message.results && (
                    <div className="mt-2 space-y-2">
                      {message.results.map((result, idx) => (
                        <div key={idx} className="border rounded p-2">
                          <p>{result.content}</p>
                          {result.type === 'image' && (
                            <img
                              src={result.source}
                              alt={result.content}
                              className="mt-2 max-w-full h-auto cursor-pointer"
                              onClick={() => setSelectedResult(result)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopMic : startMic}
          >
            {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

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
        </div>
      </div>

      <div className="flex items-start justify-between px-2">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-lg font-bold text-blue-600">カメラ</span>
            <span className="text-xs text-gray-600">撮影した画像は報告用としてサーバーに送信できます！</span>
          </div>

          <div className="flex gap-2 mb-3">
            <Button variant={mode === 'photo' ? 'default' : 'outline'} onClick={() => setMode('photo')}>📷 写真</Button>
            <Button variant={mode === 'video' ? 'default' : 'outline'} onClick={() => setMode('video')}>🎥 動画</Button>
          </div>

          {mode === 'photo' ? (
            <div className="flex flex-col items-center">
              <Button variant="secondary" size="icon" onClick={() => handleCapture('start')}>
                <Circle className="h-5 w-5" />
              </Button>
              <span className="text-xs mt-1">撮影</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <Button variant="secondary" size="icon" onClick={() => handleCapture('start')}><Play className="h-4 w-4" /></Button>
                <span className="text-xs mt-1">開始</span>
              </div>
              <div className="flex flex-col items-center">
                <Button variant="secondary" size="icon" onClick={() => handleCapture('pause')}><Pause className="h-4 w-4" /></Button>
                <span className="text-xs mt-1">一時停止</span>
              </div>
              <div className="flex flex-col items-center">
                <Button variant="secondary" size="icon" onClick={() => handleCapture('stop')}>
                  <div className="w-3 h-3 bg-black"></div>
                </Button>
                <span className="text-xs mt-1">停止</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={handleUploadToServer}>
            <UploadCloud className="h-4 w-4 mr-2" /> サーバーへ保存
          </Button>
        </div>
      </div>

      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
              onClick={() => setSelectedResult(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedResult.source} alt={selectedResult.content} className="w-full h-auto mb-4" />
            <p className="text-sm text-gray-700 whitespace-pre-line">{selectedResult.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}