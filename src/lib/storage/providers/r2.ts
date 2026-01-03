/**
 * Cloudflare R2 Storage Provider
 *
 * Implementação do StorageProvider usando Cloudflare R2
 * R2 é compatível com S3 API, então usamos o AWS SDK
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProvider,
  FileInfo,
  UploadOptions,
  SignedUrlOptions,
  ListOptions,
  ListResult,
  DeleteOptions,
  FolderInfo,
  StorageError,
  STORAGE_DEFAULTS,
} from '../types';

// ============================================================================
// R2 Client
// ============================================================================

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new StorageError(
      'NOT_CONFIGURED',
      'Cloudflare R2 não configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY'
    );
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || 'amorim-storage';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gera caminho completo (path + fileName)
 */
function buildFullPath(fileName: string, path?: string): string {
  if (!path) return fileName;
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const cleanFileName = fileName.replace(/^\/+/, '');
  return `${cleanPath}/${cleanFileName}`;
}

/**
 * Detecta content type pelo nome do arquivo
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Imagens
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    // Documentos
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Texto
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    // Vídeo
    mp4: 'video/mp4',
    webm: 'video/webm',
    // Áudio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    // Outros
    zip: 'application/zip',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// ============================================================================
// R2 Provider Implementation
// ============================================================================

export const r2StorageProvider: StorageProvider = {
  name: 'cloudflare-r2',

  async upload(
    file: File | Buffer | Blob,
    fileName: string,
    options?: UploadOptions
  ): Promise<FileInfo> {
    const client = getR2Client();
    const bucket = options?.bucket || getBucketName();
    const fullPath = buildFullPath(fileName, options?.path);

    // Detecta content type
    let contentType = options?.contentType;
    if (!contentType && file instanceof File) {
      contentType = file.type || getMimeType(fileName);
    }
    if (!contentType && file instanceof Blob) {
      contentType = file.type || getMimeType(fileName);
    }
    if (!contentType) {
      contentType = getMimeType(fileName);
    }

    // Converte para Buffer se necessário
    let body: Buffer | Blob;
    if (file instanceof File) {
      body = Buffer.from(await file.arrayBuffer());
    } else if (file instanceof Blob) {
      body = Buffer.from(await file.arrayBuffer());
    } else {
      body = file;
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fullPath,
      Body: body,
      ContentType: contentType,
      CacheControl: options?.cacheControl || STORAGE_DEFAULTS.cacheControl,
      Metadata: options?.metadata,
    });

    try {
      await client.send(command);

      // R2 não retorna info do arquivo no upload, então montamos manualmente
      const size = body instanceof Buffer ? body.length : 0;

      return {
        id: fullPath,
        name: fileName,
        path: fullPath,
        size,
        mimeType: contentType,
        publicUrl: null, // R2 bucket é privado, usar signedUrl
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: options?.metadata,
      };
    } catch (error) {
      throw new StorageError(
        'UPLOAD_FAILED',
        `Falha ao fazer upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error
      );
    }
  },

  async getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string> {
    const client = getR2Client();
    const bucket = options?.bucket || getBucketName();
    const expiresIn = options?.expiresIn || STORAGE_DEFAULTS.signedUrlExpiration;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
      ResponseContentDisposition: options?.download
        ? `attachment; filename="${typeof options.download === 'string' ? options.download : path.split('/').pop()}"`
        : undefined,
    });

    try {
      const url = await getSignedUrl(client, command, { expiresIn });
      return url;
    } catch (error) {
      throw new StorageError(
        'PROVIDER_ERROR',
        `Falha ao gerar URL assinada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error
      );
    }
  },

  getPublicUrl(_path: string, _bucket?: string): string | null {
    // R2 não tem URLs públicas por padrão (usar signedUrl ou custom domain)
    return null;
  },

  async list(options?: ListOptions): Promise<ListResult> {
    const client = getR2Client();
    const bucket = options?.bucket || getBucketName();
    const prefix = options?.path ? `${options.path.replace(/^\/+|\/+$/g, '')}/` : '';
    const limit = options?.limit || 100;

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: limit,
      Delimiter: '/', // Para listar apenas o nível atual (não recursivo)
    });

    try {
      const response = await client.send(command);

      const files: FileInfo[] = (response.Contents || [])
        .filter((obj) => obj.Key && obj.Key !== prefix) // Exclui a própria pasta
        .map((obj) => ({
          id: obj.Key!,
          name: obj.Key!.split('/').pop() || obj.Key!,
          path: obj.Key!,
          size: obj.Size || 0,
          mimeType: getMimeType(obj.Key!),
          publicUrl: null,
          createdAt: obj.LastModified || new Date(),
          updatedAt: obj.LastModified || new Date(),
        }));

      const folders: FolderInfo[] = (response.CommonPrefixes || []).map((prefix) => ({
        name: prefix.Prefix!.replace(/\/$/, '').split('/').pop() || '',
        path: prefix.Prefix!.replace(/\/$/, ''),
      }));

      return {
        files,
        folders,
        hasMore: response.IsTruncated || false,
      };
    } catch (error) {
      throw new StorageError(
        'PROVIDER_ERROR',
        `Falha ao listar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error
      );
    }
  },

  async delete(path: string, options?: DeleteOptions): Promise<boolean> {
    const client = getR2Client();
    const bucket = options?.bucket || getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    try {
      await client.send(command);
      return true;
    } catch (error) {
      throw new StorageError(
        'DELETE_FAILED',
        `Falha ao deletar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error
      );
    }
  },

  async deleteMany(paths: string[], options?: DeleteOptions): Promise<number> {
    const client = getR2Client();
    const bucket = options?.bucket || getBucketName();

    if (paths.length === 0) return 0;

    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: paths.map((path) => ({ Key: path })),
        Quiet: true,
      },
    });

    try {
      const response = await client.send(command);
      return paths.length - (response.Errors?.length || 0);
    } catch (error) {
      throw new StorageError(
        'DELETE_FAILED',
        `Falha ao deletar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error
      );
    }
  },

  async exists(path: string, bucket?: string): Promise<boolean> {
    const client = getR2Client();
    const bucketName = bucket || getBucketName();

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    try {
      await client.send(command);
      return true;
    } catch {
      return false;
    }
  },

  async getInfo(path: string, bucket?: string): Promise<FileInfo | null> {
    const client = getR2Client();
    const bucketName = bucket || getBucketName();

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    try {
      const response = await client.send(command);

      return {
        id: path,
        name: path.split('/').pop() || path,
        path,
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        publicUrl: null,
        createdAt: response.LastModified || new Date(),
        updatedAt: response.LastModified || new Date(),
        metadata: response.Metadata as Record<string, string> | undefined,
      };
    } catch {
      return null;
    }
  },

  async copy(
    sourcePath: string,
    destinationPath: string,
    bucket?: string
  ): Promise<FileInfo> {
    const client = getR2Client();
    const bucketName = bucket || getBucketName();

    const command = new CopyObjectCommand({
      Bucket: bucketName,
      Key: destinationPath,
      CopySource: `${bucketName}/${sourcePath}`,
    });

    try {
      await client.send(command);

      // Busca info do arquivo copiado
      const info = await this.getInfo(destinationPath, bucketName);
      if (!info) {
        throw new Error('Arquivo copiado mas não encontrado');
      }
      return info;
    } catch (error) {
      throw new StorageError(
        'PROVIDER_ERROR',
        `Falha ao copiar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error
      );
    }
  },

  async move(
    sourcePath: string,
    destinationPath: string,
    bucket?: string
  ): Promise<FileInfo> {
    // Move = Copy + Delete
    const fileInfo = await this.copy(sourcePath, destinationPath, bucket);
    await this.delete(sourcePath, { bucket });
    return fileInfo;
  },
};
