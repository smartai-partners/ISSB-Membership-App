// Gallery Detail Page
// Purpose: View gallery photos with lightbox

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useListGalleriesQuery } from '@/store/api/membershipApi';

export const GalleryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const { data: galleriesData, isLoading } = useListGalleriesQuery({ published: true });

  // Find the specific gallery
  const gallery = galleriesData?.galleries?.find(g => g.id === id);

  const getGalleryTypeLabel = (type: string) => {
    switch (type) {
      case 'pixieset': return 'Pixieset';
      case 'google_drive': return 'Google Drive';
      case 'internal': return 'Internal';
      default: return type;
    }
  };

  const getGalleryTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'pixieset': return 'bg-purple-100 text-purple-800';
      case 'google_drive': return 'bg-blue-100 text-blue-800';
      case 'internal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex !== null && gallery?.photos && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && gallery?.photos && selectedPhotoIndex < gallery.photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePreviousPhoto();
    if (e.key === 'ArrowRight') handleNextPhoto();
    if (e.key === 'Escape') setSelectedPhotoIndex(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gallery Not Found</h2>
          <p className="text-gray-600 mb-4">The gallery you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/galleries')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Galleries
          </button>
        </div>
      </div>
    );
  }

  // For external galleries, show a link to open them
  if (gallery.gallery_type !== 'internal' && gallery.external_url) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/galleries')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Galleries
          </button>

          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ExternalLink className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{gallery.title}</h1>

            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getGalleryTypeBadgeColor(gallery.gallery_type)}`}>
              {getGalleryTypeLabel(gallery.gallery_type)}
            </span>

            {gallery.description && (
              <p className="text-gray-600 mb-6">{gallery.description}</p>
            )}

            <p className="text-gray-600 mb-6">
              This gallery is hosted externally on {getGalleryTypeLabel(gallery.gallery_type)}.
              Click the button below to view the photos.
            </p>

            <a
              href={gallery.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              Open in {getGalleryTypeLabel(gallery.gallery_type)}
            </a>

            <div className="mt-6 flex items-center justify-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Created {new Date(gallery.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Internal gallery view
  const photos = (gallery as any).photos || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/galleries')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Galleries
          </button>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{gallery.title}</h1>
                {gallery.description && (
                  <p className="text-gray-600">{gallery.description}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGalleryTypeBadgeColor(gallery.gallery_type)}`}>
                {getGalleryTypeLabel(gallery.gallery_type)}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(gallery.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                {photos.length} photos
              </div>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
            <p className="text-gray-600">
              This gallery doesn't have any photos yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any, index: number) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer group relative"
              >
                <img
                  src={photo.thumbnail_url || photo.photo_url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            onClick={() => setSelectedPhotoIndex(null)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors z-10"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Previous button */}
            {selectedPhotoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousPhoto();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Next button */}
            {selectedPhotoIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Photo */}
            <div
              className="max-w-5xl max-h-screen p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedPhotoIndex].photo_url}
                alt={photos[selectedPhotoIndex].caption || ''}
                className="max-w-full max-h-screen object-contain rounded-lg"
              />

              {/* Photo info */}
              {photos[selectedPhotoIndex].caption && (
                <div className="mt-4 text-center">
                  <p className="text-white text-lg">{photos[selectedPhotoIndex].caption}</p>
                </div>
              )}

              {/* Photo counter */}
              <div className="mt-4 text-center text-white text-sm">
                {selectedPhotoIndex + 1} / {photos.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryDetailPage;
