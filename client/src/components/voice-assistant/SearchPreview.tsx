
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SearchPreviewProps {
  title: string;
  description: string;
  imagePath?: string;
  onClick: () => void;
}

export const SearchPreview: React.FC<SearchPreviewProps> = ({
  title,
  description,
  imagePath,
  onClick
}) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        {imagePath && (
          <div className="mt-2">
            <img src={imagePath} alt={title} className="w-full h-32 object-cover rounded-md" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
