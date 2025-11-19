// Pixieset API Client Utility
// Purpose: Interface with Pixieset API for gallery integration

export interface PixiesetCollection {
  id: string;
  name: string;
  client_gallery_url: string;
  thumbnail_url?: string;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface PixiesetPhoto {
  id: string;
  url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  created_at: string;
}

export class PixiesetClient {
  private apiKey: string;
  private baseUrl = 'https://api.pixieset.com/v2';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('PIXIESET_API_KEY') || '';

    if (!this.apiKey) {
      console.warn('PIXIESET_API_KEY not configured. Pixieset integration will not work.');
    }
  }

  /**
   * Validate that a collection ID exists and is accessible
   */
  async validateCollectionId(collectionId: string): Promise<{
    valid: boolean;
    error?: string;
    collection?: PixiesetCollection;
  }> {
    if (!this.apiKey) {
      return {
        valid: false,
        error: 'Pixieset API key not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/collections/${collectionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            valid: false,
            error: 'Collection not found or not accessible'
          };
        }
        if (response.status === 401) {
          return {
            valid: false,
            error: 'Invalid API key'
          };
        }
        return {
          valid: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();

      return {
        valid: true,
        collection: {
          id: data.id || collectionId,
          name: data.name || 'Untitled Collection',
          client_gallery_url: data.client_gallery_url || `https://client.pixieset.com/${collectionId}`,
          thumbnail_url: data.cover_photo?.thumbnail_url,
          photo_count: data.photo_count || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
      };
    } catch (error) {
      console.error('Error validating Pixieset collection:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get collection metadata
   */
  async getCollection(collectionId: string): Promise<PixiesetCollection | null> {
    const validation = await this.validateCollectionId(collectionId);
    return validation.valid ? validation.collection || null : null;
  }

  /**
   * Get photos from a collection
   */
  async getPhotos(collectionId: string, limit = 50): Promise<PixiesetPhoto[]> {
    if (!this.apiKey) {
      console.warn('Cannot fetch photos: API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionId}/photos?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch photos: HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();

      return (data.photos || []).map((photo: any) => ({
        id: photo.id,
        url: photo.url || photo.large_url || photo.original_url,
        thumbnail_url: photo.thumbnail_url || photo.small_url,
        width: photo.width || 0,
        height: photo.height || 0,
        created_at: photo.created_at,
      }));
    } catch (error) {
      console.error('Error fetching Pixieset photos:', error);
      return [];
    }
  }

  /**
   * Get public gallery URL
   */
  getGalleryUrl(collectionId: string): string {
    return `https://client.pixieset.com/${collectionId}`;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extract collection ID from various Pixieset URL formats
   */
  static extractCollectionId(input: string): string | null {
    // If it's already just an ID
    if (!input.includes('/') && !input.includes('.')) {
      return input;
    }

    // Try to extract from URL patterns:
    // https://client.pixieset.com/collection-id
    // https://client.pixieset.com/collection-id/
    // https://pixieset.com/collection-id

    const urlPatterns = [
      /pixieset\.com\/([a-zA-Z0-9_-]+)/,
      /client\.pixieset\.com\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of urlPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
}

// Singleton instance for reuse
let pixiesetClientInstance: PixiesetClient | null = null;

export function getPixiesetClient(): PixiesetClient {
  if (!pixiesetClientInstance) {
    pixiesetClientInstance = new PixiesetClient();
  }
  return pixiesetClientInstance;
}
