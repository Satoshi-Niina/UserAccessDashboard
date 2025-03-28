import React from 'react';
import { SlidePreview } from '../components/slide-preview';

export const PresentationView: React.FC = () => {
  const [slideData, setSlideData] = React.useState<any>(null);

  React.useEffect(() => {
    // データを取得
    fetch('/api/tech-support/data/data_latest.json')
      .then(res => res.json())
      .then(data => setSlideData(data));
  }, []);

  if (!slideData) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">プレゼンテーション詳細</h2>
      <div className="space-y-4">
        {slideData.slides.map((slide: any) => (
          <SlidePreview
            key={slide.スライド番号}
            slideNumber={slide.スライド番号}
            imagePath={slide.画像テキスト?.[0]?.画像パス}
            title={slide.タイトル}
            content={slide.本文}
            notes={slide.ノート}
          />
        ))}
      </div>
    </div>
  );
};