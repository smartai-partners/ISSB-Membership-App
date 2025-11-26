import { supabase } from './supabase';

const STORAGE_BUCKET = 'event-images';

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  return data.path;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) throw error;
}

/**
 * List files in a directory
 */
export async function listFiles(prefix: string = '') {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(prefix);

  if (error) throw error;

  return data;
}
