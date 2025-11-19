// Photo Upload Component
// Purpose: Drag-and-drop photo upload with preview

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useUploadPhotoMutation } from '@/store/api/membershipApi';

interface PhotoUploadProps {
  galleryId: string;
  onUploadComplete?: () => void;
  onClose?: () => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  caption: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  galleryId,
  onUploadComplete,
  onClose
}) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadPhoto] = useUploadPhotoMutation();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    const newPhotos: PhotoFile[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      uploading: false,
      uploaded: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index].caption = caption;
      return newPhotos;
    });
  };

  const uploadSinglePhoto = async (index: number) => {
    const photo = photos[index];

    // Update uploading status
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index].uploading = true;
      newPhotos[index].error = undefined;
      return newPhotos;
    });

    try {
      const formData = new FormData();
      formData.append('photo', photo.file);
      formData.append('gallery_id', galleryId);
      if (photo.caption) {
        formData.append('caption', photo.caption);
      }

      await uploadPhoto(formData as any).unwrap();

      // Mark as uploaded
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index].uploading = false;
        newPhotos[index].uploaded = true;
        return newPhotos;
      });
    } catch (error: any) {
      // Mark error
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index].uploading = false;
        newPhotos[index].error = error?.message || 'Upload failed';
        return newPhotos;
      });
    }
  };

  const uploadAllPhotos = async () => {
    const unuploadedPhotos = photos
      .map((photo, index) => ({ photo, index }))
      .filter(({ photo }) => !photo.uploaded && !photo.uploading);

    for (const { index } of unuploadedPhotos) {
      await uploadSinglePhoto(index);
    }

    onUploadComplete?.();
  };

  const allUploaded = photos.length > 0 && photos.every(p => p.uploaded);
  const hasErrors = photos.some(p => p.error);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 hover:border-green-500 bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />

        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragging ? 'Drop photos here' : 'Drag & drop photos here'}
        </p>
        <p className="text-sm text-gray-600">
          or click to browse your files
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Supports: JPG, PNG, GIF, WebP
        </p>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Photos ({photos.length})
            </h3>
            {allUploaded && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">All uploaded!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {photo.uploaded && (
                      <div className="absolute inset-0 bg-green-600 bg-opacity-75 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {photo.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {!photo.uploaded && !photo.uploading && (
                        <button
                          onClick={() => removePhoto(index)}
                          className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Caption Input */}
                    {!photo.uploaded && (
                      <input
                        type="text"
                        placeholder="Add caption (optional)"
                        value={photo.caption}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        disabled={photo.uploading}
                        className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    )}

                    {/* Status */}
                    {photo.uploading && (
                      <div className="flex items-center gap-2 mt-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-xs font-medium">Uploading...</span>
                      </div>
                    )}

                    {photo.error && (
                      <div className="flex items-center gap-2 mt-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">{photo.error}</span>
                      </div>
                    )}

                    {photo.uploaded && (
                      <div className="flex items-center gap-2 mt-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {allUploaded ? 'Close' : 'Cancel'}
        </button>

        {photos.length > 0 && !allUploaded && (
          <button
            onClick={uploadAllPhotos}
            disabled={photos.some(p => p.uploading)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload {photos.filter(p => !p.uploaded).length} Photos
          </button>
        )}
      </div>

      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900 mb-1">
                Some uploads failed
              </h4>
              <p className="text-sm text-red-700">
                Please check the errors above and try uploading the failed photos again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
