import { useState } from 'react';
import { Plus, Edit, Trash2, Upload, Image as ImageIcon, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Gallery {
  id: string;
  title: string;
  description: string;
  event_id?: string;
  created_at: string;
  is_published: boolean;
  photos_count?: number;
  cover_image_url?: string;
}

interface Photo {
  id: string;
  gallery_id: string;
  image_url: string;
  caption?: string;
  uploaded_at: string;
}

export const GalleryManagement = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);

  const [galleryFormData, setGalleryFormData] = useState({
    title: '',
    description: '',
    event_id: '',
    is_published: false
  });

  const [photoCaptions, setPhotoCaptions] = useState<{ [key: number]: string }>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(files);

    const previews = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setUploadPreviews);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadPreviews(prev => prev.filter((_, i) => i !== index));
    const newCaptions = { ...photoCaptions };
    delete newCaptions[index];
    setPhotoCaptions(newCaptions);
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      // TODO: Call create-gallery or update-gallery edge function
      console.log('Gallery data:', galleryFormData);
      setMessage({ type: 'success', text: `Gallery ${editingId ? 'updated' : 'created'} successfully` });
      resetGalleryForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save gallery' });
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one photo' });
      return;
    }

    setMessage(null);

    try {
      // TODO: Upload each file to Supabase Storage
      // TODO: Call upload-photo edge function for each uploaded file
      console.log('Uploading photos:', uploadFiles);
      console.log('With captions:', photoCaptions);
      
      setMessage({ type: 'success', text: `${uploadFiles.length} photo(s) uploaded successfully` });
      resetPhotoUpload();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload photos' });
    }
  };

  const handleEditGallery = (gallery: Gallery) => {
    setEditingId(gallery.id);
    setGalleryFormData({
      title: gallery.title,
      description: gallery.description,
      event_id: gallery.event_id || '',
      is_published: gallery.is_published
    });
    setShowGalleryForm(true);
  };

  const handleDeleteGallery = async (galleryId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete gallery "${title}"? This will also delete all photos.`)) {
      return;
    }

    try {
      // TODO: Call delete-gallery edge function
      setMessage({ type: 'success', text: 'Gallery deleted successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete gallery' });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      // TODO: Call delete-photo edge function
      setMessage({ type: 'success', text: 'Photo deleted successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete photo' });
    }
  };

  const togglePublish = async (galleryId: string, currentStatus: boolean) => {
    try {
      // TODO: Call update-gallery edge function
      setMessage({ type: 'success', text: `Gallery ${!currentStatus ? 'published' : 'unpublished'} successfully` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update gallery' });
    }
  };

  const viewGalleryPhotos = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    // TODO: Fetch photos for this gallery
  };

  const resetGalleryForm = () => {
    setGalleryFormData({
      title: '',
      description: '',
      event_id: '',
      is_published: false
    });
    setEditingId(null);
    setShowGalleryForm(false);
  };

  const resetPhotoUpload = () => {
    setUploadFiles([]);
    setUploadPreviews([]);
    setPhotoCaptions({});
    setShowPhotoUpload(false);
  };

  return (
    <div>
      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-success-light border-primary-200' : 'bg-error-light border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-primary-900' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {!selectedGallery ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{galleries.length} galleries</span>
            </div>

            <Button onClick={() => { resetGalleryForm(); setShowGalleryForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Gallery
            </Button>
          </div>

          {showGalleryForm && (
            <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Gallery' : 'Create New Gallery'}
              </h2>

              <form onSubmit={handleGallerySubmit} className="space-y-6">
                <div>
                  <label className="label-modern">Gallery Title</label>
                  <input
                    type="text"
                    value={galleryFormData.title}
                    onChange={(e) => setGalleryFormData({ ...galleryFormData, title: e.target.value })}
                    className="input-modern"
                    placeholder="Summer Conference 2025 Photos"
                    required
                  />
                </div>

                <div>
                  <label className="label-modern">Description</label>
                  <textarea
                    value={galleryFormData.description}
                    onChange={(e) => setGalleryFormData({ ...galleryFormData, description: e.target.value })}
                    rows={3}
                    className="textarea-modern"
                    placeholder="Photo collection from our annual summer conference..."
                    required
                  />
                </div>

                <div>
                  <label className="label-modern">Link to Event (Optional)</label>
                  <select
                    value={galleryFormData.event_id}
                    onChange={(e) => setGalleryFormData({ ...galleryFormData, event_id: e.target.value })}
                    className="input-modern"
                  >
                    <option value="">No event association</option>
                    {/* TODO: Populate with actual events */}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={galleryFormData.is_published}
                    onChange={(e) => setGalleryFormData({ ...galleryFormData, is_published: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                    Publish gallery immediately
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit">
                    {editingId ? 'Update Gallery' : 'Create Gallery'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetGalleryForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <div key={gallery.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {gallery.cover_image_url ? (
                    <img src={gallery.cover_image_url} alt={gallery.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      gallery.is_published ? 'bg-success-light text-primary-800' : 'bg-gray-700 text-white'
                    }`}>
                      {gallery.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{gallery.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{gallery.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      {gallery.photos_count || 0} photos
                    </span>
                    <span>{new Date(gallery.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => viewGalleryPhotos(gallery)}
                      className="flex-1"
                    >
                      View Photos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublish(gallery.id, gallery.is_published)}
                      title={gallery.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {gallery.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditGallery(gallery)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteGallery(gallery.id, gallery.title)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {galleries.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No galleries found. Create your first gallery to get started.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Button variant="outline" onClick={() => setSelectedGallery(null)}>
                ← Back to Galleries
              </Button>
              <h2 className="text-2xl font-bold text-gray-900 mt-4">{selectedGallery.title}</h2>
              <p className="text-gray-600">{selectedGallery.description}</p>
            </div>

            <Button onClick={() => setShowPhotoUpload(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          </div>

          {showPhotoUpload && (
            <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Upload Photos to Gallery</h3>

              <form onSubmit={handlePhotoUpload} className="space-y-6">
                <div>
                  <label className="label-modern">Select Photos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="input-modern"
                  />
                  <p className="text-sm text-gray-500 mt-1">You can select multiple photos. Max 5MB per photo.</p>
                </div>

                {uploadPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeUploadFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          placeholder="Caption (optional)"
                          value={photoCaptions[index] || ''}
                          onChange={(e) => setPhotoCaptions({ ...photoCaptions, [index]: e.target.value })}
                          className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={uploadFiles.length === 0}>
                    Upload {uploadFiles.length} Photo{uploadFiles.length !== 1 ? 's' : ''}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetPhotoUpload}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img src={photo.image_url} alt={photo.caption || 'Gallery photo'} className="w-full h-48 object-cover rounded-lg" />
                {photo.caption && (
                  <p className="text-xs text-gray-600 mt-1">{photo.caption}</p>
                )}
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {photos.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No photos in this gallery yet. Upload some photos to get started.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
