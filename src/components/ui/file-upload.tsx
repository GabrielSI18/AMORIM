'use client';

/**
 * FileUpload Component
 *
 * Componente de upload com drag & drop.
 * Usa o hook useStorage internamente.
 *
 * Uso:
 * ```tsx
 * <FileUpload
 *   onUploadComplete={(file) => console.log('Uploaded:', file)}
 *   accept="image/*"
 *   maxSize={5 * 1024 * 1024}
 * />
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useStorage, type UploadOptions } from '@/hooks/use-storage';
import { FileInfo, formatFileSize } from '@/lib/storage';
import { Spinner } from './spinner';

// ============================================================================
// Types
// ============================================================================

export interface FileUploadProps {
  /** Callback quando upload completa */
  onUploadComplete?: (file: FileInfo) => void;
  /** Callback quando arquivo é selecionado (antes do upload) */
  onFileSelected?: (file: File) => void;
  /** Callback de erro */
  onError?: (error: string) => void;
  /** Tipos MIME aceitos (ex: 'image/*', 'application/pdf') */
  accept?: string;
  /** Tamanho máximo em bytes */
  maxSize?: number;
  /** Pasta destino */
  folder?: string;
  /** Permite múltiplos arquivos */
  multiple?: boolean;
  /** Desabilitado */
  disabled?: boolean;
  /** Classes customizadas */
  className?: string;
  /** Texto do placeholder */
  placeholder?: string;
  /** Descrição adicional */
  description?: string;
  /** Mostrar preview de imagem */
  showPreview?: boolean;
  /** Variante visual */
  variant?: 'default' | 'compact' | 'avatar';
}

// ============================================================================
// Component
// ============================================================================

export function FileUpload({
  onUploadComplete,
  onFileSelected,
  onError,
  accept,
  maxSize,
  folder,
  multiple = false,
  disabled = false,
  className,
  placeholder = 'Arraste um arquivo ou clique para selecionar',
  description,
  showPreview = false,
  variant = 'default',
}: FileUploadProps) {
  // Estado
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hook de storage
  const { upload, uploading, error } = useStorage({
    showToasts: true,
    onUploadSuccess: (file) => {
      onUploadComplete?.(file);
      setSelectedFile(null);
      setPreview(null);
    },
    onError,
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Valida arquivo antes do upload
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // Validação de tipo
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith('/*')) {
            const prefix = type.replace('/*', '');
            return file.type.startsWith(prefix);
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return `Tipo de arquivo não permitido: ${file.type}`;
        }
      }

      // Validação de tamanho
      if (maxSize && file.size > maxSize) {
        return `Arquivo muito grande. Máximo: ${formatFileSize(maxSize)}`;
      }

      return null;
    },
    [accept, maxSize]
  );

  /**
   * Processa arquivo selecionado
   */
  const processFile = useCallback(
    async (file: File) => {
      // Valida
      const validationError = validateFile(file);
      if (validationError) {
        onError?.(validationError);
        return;
      }

      // Atualiza estado
      setSelectedFile(file);
      onFileSelected?.(file);

      // Preview para imagens
      if (showPreview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Upload automático
      const options: UploadOptions = { folder };
      if (accept) {
        options.allowedTypes = accept.split(',').map((t) => t.trim());
      }
      if (maxSize) {
        options.maxSize = maxSize;
      }

      await upload(file, options);
    },
    [validateFile, onFileSelected, showPreview, folder, accept, maxSize, upload, onError]
  );

  /**
   * Handler de input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (multiple) {
        Array.from(files).forEach(processFile);
      } else {
        processFile(files[0]);
      }

      // Reset input para permitir selecionar mesmo arquivo novamente
      e.target.value = '';
    },
    [multiple, processFile]
  );

  /**
   * Handler de drag
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      if (multiple) {
        Array.from(files).forEach(processFile);
      } else {
        processFile(files[0]);
      }
    },
    [multiple, processFile]
  );

  /**
   * Abre seletor de arquivo
   */
  const openFileSelector = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // ============================================================================
  // Render Variants
  // ============================================================================

  /**
   * Variante Avatar (circular)
   */
  if (variant === 'avatar') {
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={openFileSelector}
          disabled={disabled || uploading}
          className={cn(
            'relative w-24 h-24 rounded-full overflow-hidden',
            'border-2 border-dashed border-border',
            'hover:border-primary/50 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            isDragging && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-muted">
              {uploading ? (
                <Spinner size="md" />
              ) : (
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              )}
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>
    );
  }

  /**
   * Variante Compact (inline)
   */
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          type="button"
          onClick={openFileSelector}
          disabled={disabled || uploading}
          className={cn(
            'px-4 py-2 rounded-md',
            'border border-border bg-background',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'transition-colors text-sm font-medium',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Enviando...
            </span>
          ) : (
            'Selecionar arquivo'
          )}
        </button>
        {selectedFile && !uploading && (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {selectedFile.name}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>
    );
  }

  // ============================================================================
  // Variante Default (drag & drop area)
  // ============================================================================

  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={openFileSelector}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8',
          'flex flex-col items-center justify-center gap-4',
          'cursor-pointer transition-all',
          'hover:border-primary/50 hover:bg-accent/50',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive'
        )}
      >
        {/* Preview */}
        {preview && showPreview && (
          <div className="relative w-32 h-32 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        {/* Ícone */}
        {uploading ? (
          <Spinner size="lg" />
        ) : (
          <div className="p-4 rounded-full bg-muted">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
        )}

        {/* Texto */}
        <div className="text-center">
          <p className="text-sm font-medium">
            {uploading ? 'Enviando...' : placeholder}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {maxSize && !uploading && (
            <p className="text-xs text-muted-foreground mt-1">
              Máximo: {formatFileSize(maxSize)}
            </p>
          )}
        </div>

        {/* Input escondido */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>

      {/* Erro */}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default FileUpload;
