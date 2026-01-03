/**
 * Image Compression Utility
 * 
 * Comprime imagens no cliente antes do upload para reduzir tamanho.
 * Usa canvas para redimensionar e comprimir em JPEG/WebP.
 */

export interface CompressOptions {
  /** Largura máxima (default: 1920) */
  maxWidth?: number;
  /** Altura máxima (default: 1080) */
  maxHeight?: number;
  /** Qualidade da compressão 0-1 (default: 0.8) */
  quality?: number;
  /** Formato de saída (default: 'image/webp') */
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'image/webp',
};

/**
 * Comprime uma imagem File
 * 
 * @param file - Arquivo de imagem
 * @param options - Opções de compressão
 * @returns Promise com a imagem comprimida como data URL
 */
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width;
          width = opts.maxWidth;
        }
        
        if (height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height;
          height = opts.maxHeight;
        }

        // Criar canvas e desenhar imagem redimensionada
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao criar contexto 2D'));
          return;
        }

        // Desenhar com suavização
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para data URL comprimido
        const compressedDataUrl = canvas.toDataURL(opts.format, opts.quality);
        
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Falha ao carregar imagem'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<string[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Estima o tamanho de um data URL em bytes
 */
export function estimateDataUrlSize(dataUrl: string): number {
  // Remove o prefixo "data:image/...;base64,"
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  
  // Base64 tem overhead de ~33%
  return Math.round((base64.length * 3) / 4);
}

/**
 * Formata tamanho em bytes para exibição
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
