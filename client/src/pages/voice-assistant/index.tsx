import React, { useState } from 'react';
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';

export default function VoiceAssistant() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const handleEndSession = async () => {
    try {
      // 履歴をサーバーに送信
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

      // 履歴をクリアして検索結果をリセット
      setSearchHistory([]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('履歴の保存に失敗しました:', error);
    }
  };

  // 検索実行時に履歴に追加
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchHistory(prev => [...prev, {
      query: searchQuery,
      timestamp: new Date().toISOString()
    }]);

    // 既存の検索処理...
  };

  return (
    <div className="flex h-screen">
      {/* 左側の検索エリア */}
      <div className="w-1/2 p-4 border-r">
        <div className="mb-4">
          <div className="flex gap-2">
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

      {/* 右側のプレビューエリア */}
      <div className="w-1/2 p-4">
        <div className="grid gap-4">
          {/* 検索結果のプレビュー表示 */}
          <SearchPreview
            title="サンプルタイトル"
            description="サンプルの説明文です"
            imagePath="/path/to/image.png"
            onClick={() => {
              setSelectedItem({
                title: "サンプルタイトル",
                description: "サンプルの説明文です",
                imagePath: "/path/to/image.png"
              });
              setIsDetailOpen(true);
            }}
          />
        </div>
      </div>

      {/* 詳細表示ダイアログ */}
      {selectedItem && (
        <DetailView
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedItem.title}
          description={selectedItem.description}
          imagePath={selectedItem.imagePath}
        />
      )}
    </div>
  );
}