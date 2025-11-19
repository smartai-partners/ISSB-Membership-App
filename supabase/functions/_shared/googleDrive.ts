// Google Drive API Client Utility
// Purpose: Interface with Google Drive API for gallery integration

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink: string;
  thumbnailLink?: string;
  imageCount: number;
  createdTime: string;
  modifiedTime: string;
}

export interface GoogleDriveImage {
  id: string;
  name: string;
  webContentLink: string;
  thumbnailLink: string;
  webViewLink: string;
  mimeType: string;
  size: string;
  createdTime: string;
}

export class GoogleDriveClient {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('GOOGLE_DRIVE_API_KEY') || '';

    if (!this.apiKey) {
      console.warn('GOOGLE_DRIVE_API_KEY not configured. Google Drive integration will not work.');
    }
  }

  /**
   * Validate that a folder ID exists and is publicly accessible
   */
  async validateFolderId(folderId: string): Promise<{
    valid: boolean;
    error?: string;
    folder?: GoogleDriveFolder;
  }> {
    if (!this.apiKey) {
      return {
        valid: false,
        error: 'Google Drive API key not configured'
      };
    }

    try {
      // Get folder metadata
      const response = await fetch(
        `${this.baseUrl}/files/${folderId}?fields=id,name,webViewLink,thumbnailLink,createdTime,modifiedTime&key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            valid: false,
            error: 'Folder not found or not publicly accessible'
          };
        }
        if (response.status === 403) {
          return {
            valid: false,
            error: 'Folder is not publicly shared'
          };
        }
        return {
          valid: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const folderData = await response.json();

      // Count images in folder
      const imageCount = await this.getImageCount(folderId);

      return {
        valid: true,
        folder: {
          id: folderData.id || folderId,
          name: folderData.name || 'Untitled Folder',
          webViewLink: folderData.webViewLink || `https://drive.google.com/drive/folders/${folderId}`,
          thumbnailLink: folderData.thumbnailLink,
          imageCount,
          createdTime: folderData.createdTime,
          modifiedTime: folderData.modifiedTime,
        }
      };
    } catch (error) {
      console.error('Error validating Google Drive folder:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get folder metadata
   */
  async getFolder(folderId: string): Promise<GoogleDriveFolder | null> {
    const validation = await this.validateFolderId(folderId);
    return validation.valid ? validation.folder || null : null;
  }

  /**
   * Get count of images in folder
   */
  async getImageCount(folderId: string): Promise<number> {
    if (!this.apiKey) {
      return 0;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/files?q='${folderId}'+in+parents+and+(mimeType+contains+'image/')&fields=files(id)&key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.files?.length || 0;
    } catch (error) {
      console.error('Error counting images:', error);
      return 0;
    }
  }

  /**
   * List images from a folder
   */
  async listImages(folderId: string, limit = 50): Promise<GoogleDriveImage[]> {
    if (!this.apiKey) {
      console.warn('Cannot fetch images: API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/files?q='${folderId}'+in+parents+and+(mimeType+contains+'image/')&pageSize=${limit}&fields=files(id,name,webContentLink,thumbnailLink,webViewLink,mimeType,size,createdTime)&key=${this.apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch images: HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();

      return (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        webContentLink: file.webContentLink || '',
        thumbnailLink: file.thumbnailLink || '',
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
      }));
    } catch (error) {
      console.error('Error fetching Google Drive images:', error);
      return [];
    }
  }

  /**
   * Get public folder URL
   */
  getFolderUrl(folderId: string): string {
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extract folder ID from various Google Drive URL formats
   */
  static extractFolderId(input: string): string | null {
    // If it's already just an ID
    if (!input.includes('/') && !input.includes('?')) {
      return input;
    }

    // Try to extract from URL patterns:
    // https://drive.google.com/drive/folders/FOLDER_ID
    // https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
    // https://drive.google.com/drive/u/0/folders/FOLDER_ID

    const urlPatterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of urlPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Generate embed URL for folder
   */
  getEmbedUrl(folderId: string): string {
    return `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
  }
}

// Singleton instance for reuse
let googleDriveClientInstance: GoogleDriveClient | null = null;

export function getGoogleDriveClient(): GoogleDriveClient {
  if (!googleDriveClientInstance) {
    googleDriveClientInstance = new GoogleDriveClient();
  }
  return googleDriveClientInstance;
}
