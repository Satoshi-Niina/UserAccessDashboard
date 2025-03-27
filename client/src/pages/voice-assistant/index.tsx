
import React, { useState } from 'react';
import { SearchPreview } from '@/components/voice-assistant/SearchPreview';
import { DetailView } from '@/components/voice-assistant/DetailView';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Fuse from 'fuse.js';

export default function VoiceAssistant() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fuseで検索を実行する関数
  const performSearch = (query: string) => {
    // TODO: 実際のデータを使用して検索ロジックを実装
    const searchResults = [
      {
        title: "サンプル結果1",
        description: "これは検索結果のサンプルです",
        imagePath: "/path/to/image1.png"
      },
      // 他の検索結果...
    ];
    return searchResults;
  };

  const handleSearch = () => {
    const results = performSearch(searchQuery);
    // 検索結果の処理
  };

  return (
    <div className="flex h-screen">
      {/* 左側の検索エリア */}
      <div className="w-1/2 p-4 border-r">
        <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索キーワードを入力..."
            className="mb-2"
          />
          <Button onClick={handleSearch}>検索</Button>
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
