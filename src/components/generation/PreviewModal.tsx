import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/Button';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  htmlContent: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  htmlContent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <Button onClick={onClose} variant="secondary" className="p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-md p-4">
              <iframe
                srcDoc={htmlContent}
                className="w-full min-h-[500px] border-0"
                title={title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

