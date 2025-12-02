/**
 * Supabase Storage Provider
 *
 * Implementação do StorageProvider usando Supabase Storage
 * Bucket 'artifacts' é privado por padrão (acesso via signedUrl)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  StorageProvider,
  FileInfo,
  UploadOptions,
  SignedUrlOptions,
  ListOptions,
  ListResult,
  DeleteOptions,
  StorageError,
  STORAGE_DEFAULTS,
} from '../types';

// ============================================================================
// Supabase Client
// ============================================================================

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new StorageError(
      'NOT_CONFIGURED',
      'Supabase Storage não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converte objeto Supabase para FileInfo
 */
function toFileInfo(
  obj: {
    id?: string;
    name: string;
    created_at?: string;
    updated_at?: string;
    metadata?: { size?: number; mimetype?: string; [key: string]: unknown };
  },
  path: string,
  bucket: string
): FileInfo {
  const supabase = getSupabaseClient();

  // Tenta pegar URL pública (retorna string vazia se bucket privado)
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    id: obj.id || path,
    name: obj.name,
    path,
    size: obj.metadata?.size || 0,
    mimeType: obj.metadata?.mimetype || 'application/octet-stream',
    publicUrl: publicUrlData?.publicUrl || null,
    createdAt: obj.created_at ? new Date(obj.created_at) : new Date(),
    updatedAt: obj.updated_at ? new Date(obj.updated_at) : new Date(),
    metadata: obj.metadata as Record<string, string> | undefined,
  };
}

/**
 * Gera caminho completo (path + fileName)
 */
function buildFullPath(fileName: string, path?: string): string {
  if (!path) return fileName;
  // Remove barras extras
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const cleanFileName = fileName.replace(/^\/+/, '');
  return `${cleanPath}/${cleanFileName}`;
}

// ============================================================================
// Supabase Provider Implementation
// ============================================================================

export const supabaseStorageProvider: StorageProvider = {
  name: 'supabase',

  async upload(
    file: File | Buffer | Blob,
    fileName: string,
    options?: UploadOptions
  ): Promise<FileInfo> {
    const supabase = getSupabaseClient();
    const bucket = options?.bucket || STORAGE_DEFAULTS.bucket;
    const fullPath = buildFullPath(fileName, options?.path);

    // Detecta content type
    let contentType = options?.contentType;
    if (!contentType && file instanceof File) {
      contentType = file.type;
    }
    if (!contentType && file instanceof Blob) {
      contentType = file.type;
    }

    // Prepara opções do Supabase
    const uploadOptions = {
      contentType,
      upsert: options?.upsert ?? false,
      cacheControl: options?.cacheControl || STORAGE_DEFAULTS.cacheControl,
    };

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, uploadOptions);

    if (error) {
      // Trata erros específicos do Supabase
      if (error.message?.includes('already exists')) {
        throw new StorageError(
          'UPLOAD_FAILED',
          `Arquivo já existe: ${fullPath}. Use upsert: true para substituir.`,
          error
        );
      }
      throw new StorageError('UPLOAD_FAILED', error.message, error);
    }

    // Busca informações completas do arquivo
    const fileInfo = await this.getInfo(data.path, bucket);
    if (!fileInfo) {
      // Se não conseguir buscar info, monta manualmente
      return {
        id: data.id || data.path,
        name: fileName,
        path: data.path,
        size: file instanceof File || file instanceof Blob ? file.size : (file as Buffer).length,
        mimeType: contentType || 'application/octet-stream',
        publicUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: options?.metadata,
      };
    }

    return fileInfo;
  },

  async getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string> {
    const supabase = getSupabaseClient();
    const bucket = options?.bucket || STORAGE_DEFAULTS.bucket;
    const expiresIn = options?.expiresIn || STORAGE_DEFAULTS.signedUrlExpiration;

    // Monta opções de transformação se houver
    // Supabase tem tipos mais restritos, então fazemos cast
    const transform = options?.transform
      ? {
          width: options.transform.width,
          height: options.transform.height,
          resize: options.transform.resize,
          quality: options.transform.quality,
          // Supabase só aceita 'origin' como format no createSignedUrl
          format: options.transform.format === 'origin' ? 'origin' as const : undefined,
        }
      : undefined;

    // Monta opções de download
    const downloadOptions = options?.download
      ? typeof options.download === 'string'
        ? { download: options.download }
        : { download: true }
      : undefined;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn, {
        transform,
        ...downloadOptions,
      });

    if (error) {
      throw new StorageError('PERMISSION_DENIED', error.message, error);
    }

    return data.signedUrl;
  },

  getPublicUrl(path: string, bucket?: string): string | null {
    const supabase = getSupabaseClient();
    const bucketName = bucket || STORAGE_DEFAULTS.bucket;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);

    // Supabase sempre retorna URL, mas bucket privado não funciona
    // Retornamos null para buckets privados por convenção
    if (bucketName === 'artifacts') {
      return null; // Bucket privado
    }

    return data.publicUrl;
  },

  async list(options?: ListOptions): Promise<ListResult> {
    const supabase = getSupabaseClient();
    const bucket = options?.bucket || STORAGE_DEFAULTS.bucket;
    const path = options?.path || '';

    const listOptions: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: string };
      search?: string;
    } = {};

    if (options?.limit) listOptions.limit = options.limit;
    if (options?.offset) listOptions.offset = options.offset;
    if (options?.sortBy) {
      listOptions.sortBy = {
        column: options.sortBy.column,
        order: options.sortBy.order,
      };
    }
    if (options?.search) listOptions.search = options.search;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, listOptions);

    if (error) {
      throw new StorageError('PERMISSION_DENIED', error.message, error);
    }

    // Separa arquivos de pastas
    const files: FileInfo[] = [];
    const folders: { name: string; path: string; createdAt?: Date }[] = [];

    for (const item of data || []) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.id) {
        // É um arquivo (tem id)
        files.push(toFileInfo(item, fullPath, bucket));
      } else {
        // É uma pasta (não tem id)
        folders.push({
          name: item.name,
          path: fullPath,
          createdAt: item.created_at ? new Date(item.created_at) : undefined,
        });
      }
    }

    return {
      files,
      folders,
      hasMore: options?.limit ? files.length === options.limit : false,
    };
  },

  async delete(path: string, options?: DeleteOptions): Promise<boolean> {
    const supabase = getSupabaseClient();
    const bucket = options?.bucket || STORAGE_DEFAULTS.bucket;

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new StorageError('DELETE_FAILED', error.message, error);
    }

    return true;
  },

  async deleteMany(paths: string[], options?: DeleteOptions): Promise<number> {
    const supabase = getSupabaseClient();
    const bucket = options?.bucket || STORAGE_DEFAULTS.bucket;

    const { data, error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw new StorageError('DELETE_FAILED', error.message, error);
    }

    return data?.length || 0;
  },

  async exists(path: string, bucket?: string): Promise<boolean> {
    const info = await this.getInfo(path, bucket);
    return info !== null;
  },

  async getInfo(path: string, bucket?: string): Promise<FileInfo | null> {
    const supabase = getSupabaseClient();
    const bucketName = bucket || STORAGE_DEFAULTS.bucket;

    // Supabase não tem método direto para obter info de um arquivo
    // Usamos list no diretório pai e filtramos
    const parts = path.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(dirPath, { search: fileName });

    if (error || !data) {
      return null;
    }

    const file = data.find((f) => f.name === fileName);
    if (!file) {
      return null;
    }

    return toFileInfo(file, path, bucketName);
  },

  async copy(
    sourcePath: string,
    destPath: string,
    bucket?: string
  ): Promise<FileInfo> {
    const supabase = getSupabaseClient();
    const bucketName = bucket || STORAGE_DEFAULTS.bucket;

    const { error } = await supabase.storage
      .from(bucketName)
      .copy(sourcePath, destPath);

    if (error) {
      throw new StorageError('UPLOAD_FAILED', error.message, error);
    }

    const info = await this.getInfo(destPath, bucketName);
    if (!info) {
      throw new StorageError('FILE_NOT_FOUND', `Arquivo copiado não encontrado: ${destPath}`);
    }

    return info;
  },

  async move(
    sourcePath: string,
    destPath: string,
    bucket?: string
  ): Promise<FileInfo> {
    const supabase = getSupabaseClient();
    const bucketName = bucket || STORAGE_DEFAULTS.bucket;

    const { error } = await supabase.storage
      .from(bucketName)
      .move(sourcePath, destPath);

    if (error) {
      throw new StorageError('UPLOAD_FAILED', error.message, error);
    }

    const info = await this.getInfo(destPath, bucketName);
    if (!info) {
      throw new StorageError('FILE_NOT_FOUND', `Arquivo movido não encontrado: ${destPath}`);
    }

    return info;
  },
};
