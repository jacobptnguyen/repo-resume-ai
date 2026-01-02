import React, { useRef } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Button } from '../common/Button';
import { Upload, Trash2 } from 'lucide-react';

export const SignatureUpload: React.FC = () => {
  const { signatureUrl, updateSignatureUrl, profile } = useProfile();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (file.type !== 'image/png') {
      alert('Please upload a PNG image only.');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    try {
      // Upload to Supabase Storage
      const filePath = `${user.id}/signature.png`;
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('signatures')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      if (urlData) {
        updateSignatureUrl(urlData.signedUrl);
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      alert('Failed to upload signature. Please try again.');
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    try {
      const filePath = `${user.id}/signature.png`;
      const { error } = await supabase.storage
        .from('signatures')
        .remove([filePath]);

      if (error) throw error;

      updateSignatureUrl(null);
    } catch (error) {
      console.error('Error removing signature:', error);
      alert('Failed to remove signature. Please try again.');
    }
  };


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">
        Signature
      </h2>
      <p className="text-sm text-gray-600">Upload a PNG image of your signature for the cover letter (max 2MB)</p>

      <div className="flex items-center space-x-4">
        {signatureUrl ? (
          <>
            <img
              src={signatureUrl}
              alt="Signature"
              className="w-48 h-24 object-contain border border-gray-300 rounded"
            />
            <Button
              onClick={handleRemove}
              variant="danger"
              className="p-2"
              title="Remove signature"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Signature</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

