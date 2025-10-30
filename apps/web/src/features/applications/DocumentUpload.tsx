import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Progress } from '../../../components/ui/Progress';
import { 
  Document, 
  DocumentType 
} from '../../../../packages/types/src';
import { DocumentUploadSchema } from '../../../../packages/types/src/ApplicationValidators';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (files: File[], documentType: DocumentType) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onVerify: (documentId: string) => Promise<void>;
  documents: Document[];
  applicationId: string;
  userId: string;
  isReadOnly?: boolean;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  onDelete,
  onVerify,
  documents,
  applicationId,
  userId,
  isReadOnly = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'],
  className = ''
}) => {
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.OTHER);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-8 h-8 text-green-500" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (mimeType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported`;
    }

    return null;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert('Some files could not be added:\n' + errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Create upload queue
    const newQueueItems: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);

    // Process uploads sequentially
    for (const item of newQueueItems) {
      try {
        setUploadQueue(prev => 
          prev.map(queueItem => 
            queueItem.file === item 
              ? { ...queueItem, status: 'uploading' as const }
              : queueItem
          )
        );

        await onUpload([item.file], selectedType);

        setUploadQueue(prev => 
          prev.map(queueItem => 
            queueItem.file === item 
              ? { ...queueItem, status: 'completed' as const, progress: 100 }
              : queueItem
          )
        );
      } catch (error) {
        setUploadQueue(prev => 
          prev.map(queueItem => 
            queueItem.file === item 
              ? { ...queueItem, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
              : queueItem
          )
        );
      }
    }

    // Remove completed uploads from queue after a delay
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'completed' && item.status !== 'error'));
    }, 3000);
  }, [onUpload, selectedType, maxFileSize, acceptedFileTypes]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFromQueue = (fileToRemove: File) => {
    setUploadQueue(prev => prev.filter(item => item.file !== fileToRemove));
  };

  const retryUpload = async (item: UploadProgress) => {
    try {
      setUploadQueue(prev => 
        prev.map(queueItem => 
          queueItem.file === item 
            ? { ...queueItem, status: 'uploading' as const, progress: 0, error: undefined }
            : queueItem
        )
      );

      await onUpload([item.file], selectedType);

      setUploadQueue(prev => 
        prev.map(queueItem => 
          queueItem.file === item 
            ? { ...queueItem, status: 'completed' as const, progress: 100 }
            : queueItem
        )
      );
    } catch (error) {
      setUploadQueue(prev => 
        prev.map(queueItem => 
          queueItem.file === item 
            ? { ...queueItem, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
            : queueItem
        )
      );
    }
  };

  const renderUploadZone = () => (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !isReadOnly && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={isReadOnly}
      />
      
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <div className="mt-4">
        <p className="text-lg font-medium text-gray-900">
          {dragActive ? 'Drop files here' : 'Upload Documents'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Drag and drop your files here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Supported formats: {acceptedFileTypes.join(', ')} • Max size: {formatFileSize(maxFileSize)}
        </p>
      </div>
    </div>
  );

  const renderUploadQueue = () => {
    if (uploadQueue.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploading Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {uploadQueue.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                <div className="flex-shrink-0">
                  {getFileIcon(item.file.type, item.file.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>
                  <div className="mt-2">
                    {item.status === 'uploading' && (
                      <Progress value={item.progress} className="h-2" />
                    )}
                    {item.status === 'error' && (
                      <p className="text-xs text-red-600">{item.error}</p>
                    )}
                    {item.status === 'completed' && (
                      <div className="flex items-center text-xs text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Upload completed
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status === 'uploading' && (
                    <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {item.status === 'error' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => retryUpload(item)}
                    >
                      Retry
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeFromQueue(item.file)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDocumentList = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Uploaded Documents ({documents.length})</span>
          {!isReadOnly && (
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as DocumentType)}
              className="w-48"
            >
              {Object.values(DocumentType).map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </Select>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getFileIcon(doc.mimeType, doc.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Type: {doc.type}</span>
                      <span>Size: {formatFileSize(doc.size)}</span>
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.verified ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Pending</span>
                    </div>
                  )}
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    {!isReadOnly && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDocumentRequirements = () => (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { type: DocumentType.IDENTITY, required: true, description: 'Government-issued photo ID' },
            { type: DocumentType.CERTIFICATE, required: true, description: 'Professional certifications' },
            { type: DocumentType.TRANSCRIPT, required: false, description: 'Educational transcripts' },
            { type: DocumentType.REFERENCE, required: false, description: 'Reference letters' },
            { type: DocumentType.OTHER, required: false, description: 'Additional supporting documents' },
          ].map(req => (
            <div key={req.type} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="text-sm font-medium">{req.type.charAt(0).toUpperCase() + req.type.slice(1)}</p>
                <p className="text-xs text-gray-500">{req.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {req.required && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Required
                  </span>
                )}
                {documents.filter(doc => doc.type === req.type).length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Requirements */}
      {renderDocumentRequirements()}

      {/* Upload Zone */}
      {!isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {renderUploadZone()}
          </CardContent>
        </Card>
      )}

      {/* Upload Queue */}
      {renderUploadQueue()}

      {/* Document List */}
      {renderDocumentList()}

      {/* Upload Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Ensure all documents are clear and readable</li>
            <li>• Use PDF format for official documents when possible</li>
            <li>• File names should be descriptive (e.g., "ID_Card_John_Doe.pdf")</li>
            <li>• Maximum file size is {formatFileSize(maxFileSize)} per file</li>
            <li>• Sensitive information will be kept confidential</li>
            <li>• Documents will be verified within 3-5 business days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// Simple file input variant
export const SimpleDocumentUpload: React.FC<{
  onUpload: (files: File[], documentType: DocumentType) => Promise<void>;
  documentType: DocumentType;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  label?: string;
  description?: string;
}> = ({ 
  onUpload, 
  documentType, 
  acceptedFileTypes = ['.pdf', '.doc', '.docx'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  label = 'Upload Document',
  description = 'Select a file to upload'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    onUpload(fileArray, documentType);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      </div>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600 mt-2">Click to upload or drag and drop</p>
        <p className="text-xs text-gray-400">Max {maxFileSize / 1024 / 1024}MB</p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        accept={acceptedFileTypes.join(',')}
        className="hidden"
      />
    </div>
  );
};
