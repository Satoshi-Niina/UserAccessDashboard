import React, { useState } from 'react';
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';

// Placeholder components - Replace with actual components
const Mic = () => <span>🎤</span>;
const X = () => <span>❌</span>;


export default function VoiceAssistant() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false); // Added state for recording

  const handleEndSession = async () => {
    try {
      await fetch('/api/support-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: searchHistory,
          endTime: new Date().toISOString()
        })
      });

      setSearchHistory([]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('履歴の保存に失敗しました:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchHistory(prev => [...prev, {
      query: searchQuery,
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 p-4 border-r">
        <div className="mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRecording(!isRecording)}
              className="min-w-[40px]"
            >
              {isRecording ? <X className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索キーワードを入力"
              className="flex-1"
            />
            <Button onClick={handleSearch}>検索</Button>
            <Button
              variant="outline"
              onClick={handleEndSession}
              className="bg-red-50 hover:bg-red-100 text-red-600"
            >
              終了
            </Button>
          </div>
        </div>
      </div>

      <div className="w-1/2 p-4">
        <div className="grid gap-4">
          <SearchPreview
            title="サンプルタイトル"
            description="サンプルの説明文です"
            imagePath="/path/to/image.png"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* DetailView remains unchanged */}
    </div>
  );
}