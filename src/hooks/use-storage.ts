'use client';

/**
 * useStorage Hook
 *
 * Hook para operações de storage no cliente.
 * Abstrai Server Actions e gerencia estado de loading/error.
 *
 * Uso:
 * ```tsx
 * const { upload, uploading, progress, error } = useStorage();
 *
 * const handleUpload = async (file: File) => {
 *   const result = await upload(file, { folder: 'documents' });
 *   if (result.success) {
 *     toast.success('Arquivo enviado!');
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  uploadFile,
  uploadAvatar,
  uploadDocument,
  getFileUrl,
  getDownloadUrl,
  listUserFiles,
  deleteFile,
  deleteFiles,
  type UploadResult,
  type DeleteResult,
  type SignedUrlResult,
  type ListResult,
} from '@/actions/storage';
import { FileInfo, FolderInfo } from '@/lib/storage';

// ============================================================================
// Types
// ============================================================================

export interface UseStorageOptions {
  /** Mostrar toasts automáticos */
  showToasts?: boolean;
  /** Callback de sucesso no upload */
  onUploadSuccess?: (file: FileInfo) => void;
  /** Callback de erro */
  onError?: (error: string) => void;
}

export interface UploadOptions {
  /** Pasta dentro do path do usuário */
  folder?: string;
  /** Tipos MIME permitidos */
  allowedTypes?: string[];
  /** Tamanho máximo em bytes */
  maxSize?: number;
  /** Nome customizado */
  fileName?: string;
  /** Substituir se existir */
  upsert?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useStorage(options: UseStorageOptions = {}) {
  const { showToasts = true, onUploadSuccess, onError } = options;

  // Estados
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);

  // ============================================================================
  // Upload
  // ============================================================================

  /**
   * Upload genérico de arquivo
   */
  const upload = useCallback(
    async (file: File, uploadOptions?: UploadOptions): Promise<UploadResult> => {
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadFile(formData, uploadOptions);

        if (!result.success) {
          setError(result.error || 'Erro no upload');
          if (showToasts) toast.error(result.error || 'Erro no upload');
          onError?.(result.error || 'Erro no upload');
          return result;
        }

        if (showToasts) toast.success('Arquivo enviado!');
        if (result.file) {
          onUploadSuccess?.(result.file);
          // Adiciona à lista local
          setFiles((prev) => [...prev, result.file!]);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro no upload';
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUploading(false);
      }
    },
    [showToasts, onUploadSuccess, onError]
  );

  /**
   * Upload de avatar (atalho)
   */
  const uploadAvatarFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadAvatar(formData);

        if (!result.success) {
          setError(result.error || 'Erro no upload');
          if (showToasts) toast.error(result.error || 'Erro no upload');
          onError?.(result.error || 'Erro no upload');
          return result;
        }

        if (showToasts) toast.success('Avatar atualizado!');
        if (result.file) onUploadSuccess?.(result.file);

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro no upload';
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUploading(false);
      }
    },
    [showToasts, onUploadSuccess, onError]
  );

  /**
   * Upload de documento (atalho)
   */
  const uploadDocumentFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadDocument(formData);

        if (!result.success) {
          setError(result.error || 'Erro no upload');
          if (showToasts) toast.error(result.error || 'Erro no upload');
          onError?.(result.error || 'Erro no upload');
          return result;
        }

        if (showToasts) toast.success('Documento enviado!');
        if (result.file) {
          onUploadSuccess?.(result.file);
          setFiles((prev) => [...prev, result.file!]);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro no upload';
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setUploading(false);
      }
    },
    [showToasts, onUploadSuccess, onError]
  );

  // ============================================================================
  // URLs
  // ============================================================================

  /**
   * Obtém URL assinada para visualização
   */
  const getUrl = useCallback(
    async (path: string, expiresIn?: number): Promise<SignedUrlResult> => {
      setLoading(true);
      try {
        const result = await getFileUrl(path, { expiresIn });
        if (!result.success && showToasts) {
          toast.error(result.error || 'Erro ao obter URL');
        }
        return result;
      } finally {
        setLoading(false);
      }
    },
    [showToasts]
  );

  /**
   * Obtém URL de download
   */
  const download = useCallback(
    async (path: string, fileName?: string): Promise<SignedUrlResult> => {
      setLoading(true);
      try {
        const result = await getDownloadUrl(path, fileName);
        if (result.success && result.url) {
          // Abre download em nova aba
          window.open(result.url, '_blank');
        } else if (showToasts) {
          toast.error(result.error || 'Erro ao baixar arquivo');
        }
        return result;
      } finally {
        setLoading(false);
      }
    },
    [showToasts]
  );

  // ============================================================================
  // List
  // ============================================================================

  /**
   * Lista arquivos do usuário
   */
  const list = useCallback(
    async (folder?: string, limit?: number, offset?: number): Promise<ListResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await listUserFiles({ folder, limit, offset });

        if (!result.success) {
          setError(result.error || 'Erro ao listar');
          if (showToasts) toast.error(result.error || 'Erro ao listar');
          return result;
        }

        setFiles(result.files || []);
        setFolders(result.folders || []);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao listar';
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [showToasts]
  );

  // ============================================================================
  // Delete
  // ============================================================================

  /**
   * Remove arquivo
   */
  const remove = useCallback(
    async (path: string): Promise<DeleteResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await deleteFile(path);

        if (!result.success) {
          setError(result.error || 'Erro ao deletar');
          if (showToasts) toast.error(result.error || 'Erro ao deletar');
          onError?.(result.error || 'Erro ao deletar');
          return result;
        }

        if (showToasts) toast.success('Arquivo removido');
        // Remove da lista local
        setFiles((prev) => prev.filter((f) => f.path !== path));

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar';
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [showToasts, onError]
  );

  /**
   * Remove múltiplos arquivos
   */
  const removeMany = useCallback(
    async (paths: string[]): Promise<DeleteResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await deleteFiles(paths);

        if (!result.success) {
          setError(result.error || 'Erro ao deletar');
          if (showToasts) toast.error(result.error || 'Erro ao deletar');
          onError?.(result.error || 'Erro ao deletar');
          return result;
        }

        if (showToasts) toast.success(`${paths.length} arquivos removidos`);
        // Remove da lista local
        setFiles((prev) => prev.filter((f) => !paths.includes(f.path)));

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar';
        setError(errorMsg);
        if (showToasts) toast.error(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [showToasts, onError]
  );

  // ============================================================================
  // Utils
  // ============================================================================

  /**
   * Limpa erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Limpa lista de arquivos
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setFolders([]);
  }, []);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Estados
    uploading,
    loading,
    error,
    files,
    folders,

    // Upload
    upload,
    uploadAvatar: uploadAvatarFile,
    uploadDocument: uploadDocumentFile,

    // URLs
    getUrl,
    download,

    // List
    list,

    // Delete
    remove,
    removeMany,

    // Utils
    clearError,
    clearFiles,
  };
}

// ============================================================================
// Types Export
// ============================================================================

export type { UploadResult, DeleteResult, SignedUrlResult, ListResult };
