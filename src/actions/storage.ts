'use server';

/**
 * Storage Server Actions
 *
 * Server Actions para operações de storage.
 * Preferível a API Routes por serem mais simples e type-safe.
 */

import { auth } from '@clerk/nextjs/server';
import {
  storage,
  getUserPath,
  generateUniqueFileName,
  isAllowedFileType,
  formatFileSize,
  StorageError,
  FileInfo,
  FolderInfo,
  UploadOptions,
  ListOptions,
  SignedUrlOptions,
  STORAGE_DEFAULTS,
} from '@/lib/storage';

// ============================================================================
// Types
// ============================================================================

export interface UploadResult {
  success: boolean;
  file?: FileInfo;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ListResult {
  success: boolean;
  files?: FileInfo[];
  folders?: FolderInfo[];
  hasMore?: boolean;
  error?: string;
}

// ============================================================================
// Upload Actions
// ============================================================================

/**
 * Upload de arquivo para o storage
 *
 * @param formData - FormData com o arquivo (key: 'file')
 * @param options - Opções de upload
 */
export async function uploadFile(
  formData: FormData,
  options?: {
    /** Pasta dentro do path do usuário (ex: 'avatars', 'documents') */
    folder?: string;
    /** Tipos MIME permitidos (default: todos) */
    allowedTypes?: string[];
    /** Tamanho máximo em bytes (default: 50MB) */
    maxSize?: number;
    /** Nome customizado (default: nome original) */
    fileName?: string;
    /** Substituir se existir */
    upsert?: boolean;
  }
): Promise<UploadResult> {
  try {
    // Autenticação
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Obtém arquivo do FormData
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'Nenhum arquivo enviado' };
    }

    // Validação de tipo
    const allowedTypes = options?.allowedTypes || [];
    if (allowedTypes.length > 0 && !isAllowedFileType(file.type, allowedTypes)) {
      return {
        success: false,
        error: `Tipo de arquivo não permitido: ${file.type}`,
      };
    }

    // Validação de tamanho
    const maxSize = options?.maxSize || STORAGE_DEFAULTS.maxFileSize;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Arquivo muito grande. Máximo: ${formatFileSize(maxSize)}`,
      };
    }

    // Monta path e nome
    const userPath = getUserPath(userId, options?.folder);
    const fileName = options?.fileName || generateUniqueFileName(file.name);

    // Upload
    const uploadOptions: UploadOptions = {
      path: userPath,
      upsert: options?.upsert ?? false,
      contentType: file.type,
    };

    const fileInfo = await storage.upload(file, fileName, uploadOptions);

    return { success: true, file: fileInfo };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    if (error instanceof StorageError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao fazer upload' };
  }
}

/**
 * Upload de avatar (imagem de perfil)
 */
export async function uploadAvatar(formData: FormData): Promise<UploadResult> {
  return uploadFile(formData, {
    folder: 'avatars',
    allowedTypes: ['image/*'],
    maxSize: 5 * 1024 * 1024, // 5MB
    upsert: true,
    fileName: 'avatar.webp', // Sempre mesmo nome para substituir
  });
}

/**
 * Upload de documento
 */
export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  return uploadFile(formData, {
    folder: 'documents',
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
  });
}

// ============================================================================
// URL Actions
// ============================================================================

/**
 * Gera URL assinada para download
 *
 * @param path - Caminho do arquivo
 * @param options - Opções da URL
 */
export async function getFileUrl(
  path: string,
  options?: SignedUrlOptions
): Promise<SignedUrlResult> {
  try {
    // Autenticação
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Verifica se o arquivo pertence ao usuário (segurança)
    const userPrefix = `users/${userId}/`;
    if (!path.startsWith(userPrefix)) {
      return { success: false, error: 'Acesso negado' };
    }

    const url = await storage.getSignedUrl(path, options);
    return { success: true, url };
  } catch (error) {
    console.error('[Storage] Get URL error:', error);
    if (error instanceof StorageError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao gerar URL' };
  }
}

/**
 * Gera URL assinada para download direto
 */
export async function getDownloadUrl(
  path: string,
  fileName?: string
): Promise<SignedUrlResult> {
  return getFileUrl(path, {
    download: fileName || true,
    expiresIn: 300, // 5 minutos
  });
}

// ============================================================================
// List Actions
// ============================================================================

/**
 * Lista arquivos do usuário
 *
 * @param options - Opções de listagem
 */
export async function listUserFiles(
  options?: {
    /** Pasta específica (ex: 'avatars', 'documents') */
    folder?: string;
    /** Limite de resultados */
    limit?: number;
    /** Offset para paginação */
    offset?: number;
  }
): Promise<ListResult> {
  try {
    // Autenticação
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    const userPath = getUserPath(userId, options?.folder);

    const listOptions: ListOptions = {
      path: userPath,
      limit: options?.limit,
      offset: options?.offset,
    };

    const result = await storage.list(listOptions);
    return {
      success: true,
      files: result.files,
      folders: result.folders,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error('[Storage] List error:', error);
    if (error instanceof StorageError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao listar arquivos' };
  }
}

// ============================================================================
// Delete Actions
// ============================================================================

/**
 * Deleta arquivo do usuário
 *
 * @param path - Caminho do arquivo
 */
export async function deleteFile(path: string): Promise<DeleteResult> {
  try {
    // Autenticação
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Verifica se o arquivo pertence ao usuário (segurança)
    const userPrefix = `users/${userId}/`;
    if (!path.startsWith(userPrefix)) {
      return { success: false, error: 'Acesso negado' };
    }

    await storage.delete(path);
    return { success: true };
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    if (error instanceof StorageError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao deletar arquivo' };
  }
}

/**
 * Deleta múltiplos arquivos do usuário
 *
 * @param paths - Lista de caminhos
 */
export async function deleteFiles(paths: string[]): Promise<DeleteResult> {
  try {
    // Autenticação
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Não autorizado' };
    }

    // Verifica se todos os arquivos pertencem ao usuário
    const userPrefix = `users/${userId}/`;
    const unauthorized = paths.find((p) => !p.startsWith(userPrefix));
    if (unauthorized) {
      return { success: false, error: 'Acesso negado a um ou mais arquivos' };
    }

    await storage.deleteMany(paths);
    return { success: true };
  } catch (error) {
    console.error('[Storage] Delete many error:', error);
    if (error instanceof StorageError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro ao deletar arquivos' };
  }
}
