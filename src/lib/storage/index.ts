/**
 * Storage System - Factory e Export Principal
 *
 * Sistema de storage abstrato com suporte a múltiplos providers.
 * Segue o mesmo padrão do sistema de AI (providers configuráveis).
 *
 * Uso:
 * ```ts
 * import { storage } from '@/lib/storage';
 *
 * // Upload
 * const file = await storage.upload(file, 'avatar.png', { path: 'users/123' });
 *
 * // URL assinada (bucket privado)
 * const url = await storage.getSignedUrl(file.path);
 *
 * // Listar arquivos
 * const { files } = await storage.list({ path: 'users/123' });
 * ```
 */

import { StorageProvider, StorageError } from './types';
import { supabaseStorageProvider } from './providers/supabase';

// ============================================================================
// Provider Registry
// ============================================================================

/**
 * Registro de providers disponíveis
 * Adicione novos providers aqui (S3, R2, Blob, etc)
 */
const providers: Record<string, StorageProvider> = {
  supabase: supabaseStorageProvider,
  // s3: s3StorageProvider,
  // r2: r2StorageProvider,
  // blob: vercelBlobProvider,
};

// ============================================================================
// Provider Selection
// ============================================================================

/**
 * Determina qual provider usar baseado nas variáveis de ambiente
 * Ordem de prioridade: s3 > r2 > blob > supabase (default)
 */
function getActiveProvider(): StorageProvider {
  // Verifica se storage está desabilitado
  if (process.env.ACTIVE_STORAGE !== 'true') {
    throw new StorageError(
      'NOT_CONFIGURED',
      'Storage está desabilitado. Defina ACTIVE_STORAGE=true no .env.local'
    );
  }

  // Ordem de prioridade (futuro)
  // if (process.env.ACTIVE_STORAGE_S3 === 'true' && providers.s3) {
  //   return providers.s3;
  // }
  // if (process.env.ACTIVE_STORAGE_R2 === 'true' && providers.r2) {
  //   return providers.r2;
  // }
  // if (process.env.ACTIVE_STORAGE_BLOB === 'true' && providers.blob) {
  //   return providers.blob;
  // }

  // Default: Supabase
  if (process.env.ACTIVE_STORAGE_SUPABASE === 'true' || !hasOtherProvider()) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new StorageError(
        'NOT_CONFIGURED',
        'Supabase Storage não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
      );
    }
    return providers.supabase;
  }

  throw new StorageError(
    'NOT_CONFIGURED',
    'Nenhum provider de storage ativo. Defina ACTIVE_STORAGE_SUPABASE=true'
  );
}

/**
 * Verifica se há outro provider além do Supabase configurado
 */
function hasOtherProvider(): boolean {
  return (
    process.env.ACTIVE_STORAGE_S3 === 'true' ||
    process.env.ACTIVE_STORAGE_R2 === 'true' ||
    process.env.ACTIVE_STORAGE_BLOB === 'true'
  );
}

// ============================================================================
// Lazy Initialization
// ============================================================================

let activeProvider: StorageProvider | null = null;

/**
 * Obtém o provider ativo (lazy initialization)
 */
function getStorage(): StorageProvider {
  if (!activeProvider) {
    activeProvider = getActiveProvider();
  }
  return activeProvider;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Instância do storage ativo
 *
 * Uso:
 * ```ts
 * import { storage } from '@/lib/storage';
 * const file = await storage.upload(data, 'file.pdf');
 * ```
 */
export const storage: StorageProvider = {
  get name() {
    return getStorage().name;
  },

  upload: (...args) => getStorage().upload(...args),
  getSignedUrl: (...args) => getStorage().getSignedUrl(...args),
  getPublicUrl: (...args) => getStorage().getPublicUrl(...args),
  list: (...args) => getStorage().list(...args),
  delete: (...args) => getStorage().delete(...args),
  deleteMany: (...args) => getStorage().deleteMany(...args),
  exists: (...args) => getStorage().exists(...args),
  getInfo: (...args) => getStorage().getInfo(...args),
  copy: (...args) => getStorage().copy(...args),
  move: (...args) => getStorage().move(...args),
};

// ============================================================================
// Re-exports
// ============================================================================

export * from './types';
export { supabaseStorageProvider } from './providers/supabase';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Verifica se storage está configurado e ativo
 */
export function isStorageEnabled(): boolean {
  try {
    getStorage();
    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna nome do provider ativo
 */
export function getActiveStorageProvider(): string | null {
  try {
    return getStorage().name;
  } catch {
    return null;
  }
}

/**
 * Helper para gerar path de usuário
 */
export function getUserPath(userId: string, folder?: string): string {
  const base = `users/${userId}`;
  return folder ? `${base}/${folder}` : base;
}

/**
 * Helper para gerar nome único de arquivo
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${safeName}_${timestamp}_${random}.${ext}`;
}

/**
 * Valida tipo de arquivo
 */
export function isAllowedFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  if (allowedTypes.length === 0) return true;

  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      // Wildcard: image/*, video/*, etc
      const prefix = type.replace('/*', '');
      return mimeType.startsWith(prefix);
    }
    return mimeType === type;
  });
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
