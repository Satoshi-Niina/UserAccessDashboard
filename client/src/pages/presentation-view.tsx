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
      <h2 className="text-2xl font-bold mb-2">{slideData?.metadata?.タイトル || "無題のプレゼンテーション"}</h2>
      <div className="text-sm text-gray-500 mb-4">
        作成者: {slideData?.metadata?.作成者 || "不明"}
        {slideData?.metadata?.作成日 && ` / 作成日: ${new Date(slideData.metadata.作成日).toLocaleDateString()}`}
      </div>
      <div className="grid grid-cols-5 gap-4">
        {slideData.slides.map((slide: any) => (
          <SlidePreview
            key={slide.スライド番号}
            slideNumber={slide.スライド番号}
            imagePath={`/api/tech-support/images/slide_${slide.スライド番号}_image.png`}
            title={slide.タイトル}
            content={slide.本文 || []}
            notes={slide.ノート}
          />
        ))}
      </div>
    </div>
  );
};