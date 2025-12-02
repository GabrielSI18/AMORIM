'use client';

/**
 * Página de Exemplo - Storage
 *
 * Testa upload, listagem, download e deleção de arquivos via Supabase Storage
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FileUpload } from '@/components/ui/file-upload';
import { useStorage } from '@/hooks/use-storage';
import { formatFileSize } from '@/lib/storage';

export default function StorageExamplesPage() {
  const {
    files,
    folders,
    loading,
    error,
    list,
    remove,
    getUrl,
    download,
    clearError,
  } = useStorage({ showToasts: true });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');

  // Carrega arquivos ao montar e quando muda o path
  useEffect(() => {
    list(currentPath || undefined);
  }, [currentPath, list]);

  // Gera URL de preview para um arquivo
  const handlePreview = async (path: string, mimeType: string) => {
    const result = await getUrl(path, 3600); // 1 hora
    if (result.success && result.url) {
      setPreviewUrl(result.url);
      setPreviewMimeType(mimeType);
    }
  };

  // Fecha preview
  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewMimeType(null);
  };

  // Navega para uma pasta
  const navigateToFolder = (folderName: string) => {
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  // Volta um nível
  const navigateUp = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  // Path breadcrumbs
  const pathParts = currentPath ? currentPath.split('/') : [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📁 Storage Examples</h1>
        <p className="text-muted-foreground">
          Teste upload, listagem, download e deleção de arquivos via Supabase Storage.
        </p>
      </div>

      {/* Status */}
      <div className="mb-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">⚙️ Configuração</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <code>ACTIVE_STORAGE=true</code> no .env.local</li>
          <li>• <code>NEXT_PUBLIC_SUPABASE_URL</code> configurado</li>
          <li>• <code>SUPABASE_SERVICE_ROLE_KEY</code> configurado</li>
          <li>• Bucket <code>artifacts</code> criado no Supabase Dashboard</li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center justify-between">
          <span className="text-destructive">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Limpar
          </Button>
        </div>
      )}

      {/* Upload Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📤 Upload</h2>
        
        {/* Default variant */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Drag & Drop (default)</h3>
          <FileUpload
            onUploadComplete={(file) => {
              console.log('Upload complete:', file);
              list(currentPath || undefined);
            }}
            accept="image/*,application/pdf"
            maxSize={10 * 1024 * 1024} // 10MB
            folder={currentPath || 'uploads'}
            showPreview
          />
        </div>

        {/* Compact variant */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Compact</h3>
          <FileUpload
            variant="compact"
            onUploadComplete={(file) => {
              console.log('Upload complete:', file);
              list(currentPath || undefined);
            }}
            accept="*/*"
            folder={currentPath || 'documents'}
          />
        </div>

        {/* Avatar variant */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Avatar</h3>
          <FileUpload
            variant="avatar"
            onUploadComplete={(file) => {
              console.log('Avatar upload:', file);
              list(currentPath || undefined);
            }}
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            folder="avatars"
          />
        </div>
      </section>

      {/* List Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📋 Arquivos</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => list(currentPath || undefined)}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : '🔄 Atualizar'}
          </Button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 mb-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPath('')}
            className="px-2 py-1 h-auto"
          >
            🏠 Raiz
          </Button>
          {pathParts.map((part, index) => (
            <span key={index} className="flex items-center">
              <span className="text-muted-foreground mx-1">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPath(pathParts.slice(0, index + 1).join('/'))}
                className="px-2 py-1 h-auto"
              >
                {part}
              </Button>
            </span>
          ))}
        </div>

        {/* Back button */}
        {currentPath && (
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateUp}
            className="mb-2"
          >
            ⬅️ Voltar
          </Button>
        )}

        {loading && files.length === 0 && folders.length === 0 ? (
          <div className="text-center py-8">
            <Spinner size="lg" />
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum arquivo ou pasta encontrado
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Nome</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Tamanho</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* Folders first */}
                {folders.map((folder) => (
                  <tr
                    key={folder.path}
                    className="border-t cursor-pointer hover:bg-muted/50"
                    onClick={() => navigateToFolder(folder.name)}
                  >
                    <td className="px-4 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        📁 <span className="font-medium">{folder.name}/</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      Pasta
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToFolder(folder.name);
                        }}
                      >
                        ➡️
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Then files */}
                {files.map((file) => (
                  <tr key={file.path} className="border-t">
                    <td className="px-4 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        📄 <span className="font-mono text-xs">{file.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">
                      {file.mimeType}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(file.path, file.mimeType)}
                        >
                          👁️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => download(file.path, file.name)}
                        >
                          ⬇️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(file.path)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closePreview}
        >
          <div
            className="bg-background p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Preview</h3>
              <Button variant="ghost" size="sm" onClick={closePreview}>
                ✕
              </Button>
            </div>
            {previewMimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh]" />
            ) : previewMimeType === 'application/pdf' ? (
              <iframe src={previewUrl} className="w-full h-[70vh]" />
            ) : previewMimeType?.startsWith('video/') ? (
              <video src={previewUrl} controls className="max-w-full max-h-[70vh]" />
            ) : previewMimeType?.startsWith('audio/') ? (
              <audio src={previewUrl} controls className="w-full" />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Tipo de arquivo não suporta preview inline ({previewMimeType})
                </p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Abrir em nova aba
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Docs */}
      <section className="mt-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">📚 Documentação</h2>
        <ul className="text-sm space-y-1">
          <li>• Types: <code>src/lib/storage/types.ts</code></li>
          <li>• Provider: <code>src/lib/storage/providers/supabase.ts</code></li>
          <li>• Actions: <code>src/actions/storage.ts</code></li>
          <li>• Hook: <code>src/hooks/use-storage.ts</code></li>
          <li>• Component: <code>src/components/ui/file-upload.tsx</code></li>
        </ul>
      </section>
    </div>
  );
}
