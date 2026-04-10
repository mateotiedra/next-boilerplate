/**
 * Abstract Storage Module
 * ========================
 * S3-compatible interface. Backed by any provider:
 * Cloudflare R2, AWS S3, MinIO, etc.
 *
 * Configure per project via STORAGE_* env vars.
 * Install the SDK when needed: pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

export interface StorageFile {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
}

export interface UploadOptions {
  key: string;
  body: Buffer | ReadableStream | Blob;
  contentType?: string;
  isPublic?: boolean;
}

export interface StorageProvider {
  upload(options: UploadOptions): Promise<StorageFile>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

class PlaceholderStorage implements StorageProvider {
  private error(): never {
    throw new Error(
      'Storage not configured. Set STORAGE_* env vars and implement a provider in lib/storage/index.ts'
    );
  }

  async upload(_options: UploadOptions): Promise<StorageFile> { this.error(); }
  async download(_key: string): Promise<Buffer> { this.error(); }
  async delete(_key: string): Promise<void> { this.error(); }
  getUrl(_key: string): string { this.error(); }
  async getSignedUrl(_key: string, _expiresInSeconds?: number): Promise<string> { this.error(); }
}

export const storage: StorageProvider = new PlaceholderStorage();

export function generateStorageKey(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = filename.split('.').pop();
  return `${prefix}/${timestamp}-${random}.${ext}`;
}
