/**
 * Storage Types - Tipos para sistema de storage abstrato
 *
 * Interface comum para todos os providers (Supabase, S3, R2, Blob)
 * Garante que a aplicação não dependa de um provider específico
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Informações de um arquivo armazenado
 */
export interface FileInfo {
  /** ID único do arquivo */
  id: string;
  /** Nome original do arquivo */
  name: string;
  /** Caminho completo no bucket (path/to/file.ext) */
  path: string;
  /** Tamanho em bytes */
  size: number;
  /** Tipo MIME (image/png, application/pdf, etc) */
  mimeType: string;
  /** URL pública (se bucket público) ou null */
  publicUrl: string | null;
  /** Data de criação */
  createdAt: Date;
  /** Data de última modificação */
  updatedAt: Date;
  /** Metadados customizados */
  metadata?: Record<string, string>;
}

/**
 * Opções para upload de arquivo
 */
export interface UploadOptions {
  /** Nome do bucket (default: 'artifacts') */
  bucket?: string;
  /** Caminho/pasta dentro do bucket (ex: 'users/123/avatars') */
  path?: string;
  /** Substituir arquivo se já existir */
  upsert?: boolean;
  /** Tipo MIME (detectado automaticamente se não informado) */
  contentType?: string;
  /** Metadados customizados */
  metadata?: Record<string, string>;
  /** Definir cache control header */
  cacheControl?: string;
}

/**
 * Opções para gerar URL assinada
 */
export interface SignedUrlOptions {
  /** Nome do bucket */
  bucket?: string;
  /** Tempo de expiração em segundos (default: 3600 = 1 hora) */
  expiresIn?: number;
  /** Forçar download ao acessar URL */
  download?: boolean | string;
  /** Transformações de imagem (resize, crop, etc) - se suportado */
  transform?: ImageTransform;
}

/**
 * Transformações de imagem (suportado por alguns providers)
 */
export interface ImageTransform {
  /** Largura máxima */
  width?: number;
  /** Altura máxima */
  height?: number;
  /** Modo de redimensionamento */
  resize?: 'cover' | 'contain' | 'fill';
  /** Qualidade (1-100) */
  quality?: number;
  /** Formato de saída */
  format?: 'origin' | 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * Opções para listar arquivos
 */
export interface ListOptions {
  /** Nome do bucket */
  bucket?: string;
  /** Caminho/pasta para listar */
  path?: string;
  /** Limite de resultados */
  limit?: number;
  /** Offset para paginação */
  offset?: number;
  /** Ordenação */
  sortBy?: {
    column: 'name' | 'created_at' | 'updated_at';
    order: 'asc' | 'desc';
  };
  /** Filtro por prefixo do nome */
  search?: string;
}

/**
 * Informações de uma pasta
 */
export interface FolderInfo {
  /** Nome da pasta */
  name: string;
  /** Caminho completo da pasta */
  path: string;
  /** Data de criação (se disponível) */
  createdAt?: Date;
}

/**
 * Resultado de listagem com paginação
 */
export interface ListResult {
  files: FileInfo[];
  /** Pastas no diretório atual */
  folders: FolderInfo[];
  /** Total de arquivos (se disponível) */
  total?: number;
  /** Há mais resultados */
  hasMore: boolean;
}

/**
 * Opções para deletar arquivo
 */
export interface DeleteOptions {
  /** Nome do bucket */
  bucket?: string;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Interface base que todos os storage providers devem implementar
 *
 * Exemplos de providers:
 * - Supabase Storage
 * - AWS S3
 * - Cloudflare R2
 * - Vercel Blob
 */
export interface StorageProvider {
  /** Nome do provider (para logs/debug) */
  readonly name: string;

  /**
   * Upload de arquivo
   * @param file - Arquivo (File, Buffer, ou stream)
   * @param fileName - Nome do arquivo
   * @param options - Opções de upload
   * @returns Informações do arquivo salvo
   */
  upload(
    file: File | Buffer | Blob,
    fileName: string,
    options?: UploadOptions
  ): Promise<FileInfo>;

  /**
   * Gera URL assinada para acesso temporário
   * @param path - Caminho do arquivo
   * @param options - Opções da URL
   * @returns URL assinada
   */
  getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Retorna URL pública (se bucket público)
   * @param path - Caminho do arquivo
   * @param bucket - Nome do bucket
   * @returns URL pública ou null se bucket privado
   */
  getPublicUrl(path: string, bucket?: string): string | null;

  /**
   * Lista arquivos
   * @param options - Opções de listagem
   * @returns Lista de arquivos com paginação
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Deleta arquivo
   * @param path - Caminho do arquivo
   * @param options - Opções de deleção
   * @returns true se deletado com sucesso
   */
  delete(path: string, options?: DeleteOptions): Promise<boolean>;

  /**
   * Deleta múltiplos arquivos
   * @param paths - Lista de caminhos
   * @param options - Opções de deleção
   * @returns Número de arquivos deletados
   */
  deleteMany(paths: string[], options?: DeleteOptions): Promise<number>;

  /**
   * Verifica se arquivo existe
   * @param path - Caminho do arquivo
   * @param bucket - Nome do bucket
   * @returns true se existe
   */
  exists(path: string, bucket?: string): Promise<boolean>;

  /**
   * Obtém informações do arquivo
   * @param path - Caminho do arquivo
   * @param bucket - Nome do bucket
   * @returns Informações do arquivo ou null se não existir
   */
  getInfo(path: string, bucket?: string): Promise<FileInfo | null>;

  /**
   * Copia arquivo para outro caminho
   * @param sourcePath - Caminho origem
   * @param destPath - Caminho destino
   * @param bucket - Nome do bucket
   * @returns Informações do arquivo copiado
   */
  copy(sourcePath: string, destPath: string, bucket?: string): Promise<FileInfo>;

  /**
   * Move arquivo para outro caminho
   * @param sourcePath - Caminho origem
   * @param destPath - Caminho destino
   * @param bucket - Nome do bucket
   * @returns Informações do arquivo movido
   */
  move(sourcePath: string, destPath: string, bucket?: string): Promise<FileInfo>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Códigos de erro do storage
 */
export type StorageErrorCode =
  | 'FILE_NOT_FOUND'
  | 'BUCKET_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'UPLOAD_FAILED'
  | 'DELETE_FAILED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'PROVIDER_ERROR'
  | 'NOT_CONFIGURED';

/**
 * Erro customizado do storage
 */
export class StorageError extends Error {
  constructor(
    public code: StorageErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// ============================================================================
// Config Types
// ============================================================================

/**
 * Configuração do storage
 */
export interface StorageConfig {
  /** Provider ativo */
  provider: 'supabase' | 's3' | 'r2' | 'blob';
  /** Bucket padrão */
  defaultBucket: string;
  /** Tamanho máximo de upload em bytes (default: 50MB) */
  maxFileSize?: number;
  /** Tipos MIME permitidos (default: todos) */
  allowedMimeTypes?: string[];
}

/**
 * Constantes padrão
 */
export const STORAGE_DEFAULTS = {
  bucket: 'artifacts',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  signedUrlExpiration: 3600, // 1 hora
  cacheControl: '3600',
} as const;
