import React from 'react';

interface SlidePreviewProps {
  slideNumber: number;
  imagePath: string;
  title?: string;
  content: string[];
  notes?: string;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slideNumber,
  imagePath,
  title,
  content,
  notes
}) => {
  return (
    <div className="border rounded-lg p-2 hover:shadow-lg transition-shadow">
      <div className="text-sm text-gray-500 mb-1">
        {title ? `${title} (スライド ${slideNumber})` : `スライド ${slideNumber}`}
      </div>
      {imagePath && (
        <div className="mb-4">
          <img 
            src={`/api/tech-support/images/${imagePath}`}
            alt={`スライド ${slideNumber}`}
            className="w-full h-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              console.error(`画像読み込みエラー: ${imagePath}`);
              target.src = '/placeholder-image.png';
            }}
          />
        </div>
      )}
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      {content.map((text, i) => (
        <p key={i} className="mb-1">{text}</p>
      ))}
      {notes && (
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}
    </div>
  );
};