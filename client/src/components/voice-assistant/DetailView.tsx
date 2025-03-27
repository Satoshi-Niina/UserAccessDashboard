
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imagePath?: string;
}

export const DetailView: React.FC<DetailViewProps> = ({
  isOpen,
  onClose,
  title,
  description,
  imagePath
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {imagePath && (
            <div className="mb-4">
              <img src={imagePath} alt={title} className="w-full rounded-lg" />
            </div>
          )}
          <p className="text-gray-700">{description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
