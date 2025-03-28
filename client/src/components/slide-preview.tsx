
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
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">スライド {slideNumber}</h3>
      {imagePath && (
        <div className="mb-4">
          <img 
            src={`/api/tech-support/images/${imagePath}`} 
            alt={`スライド ${slideNumber}`}
            className="max-w-full h-auto"
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
