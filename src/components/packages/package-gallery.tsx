'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageGalleryProps {
  images: string[];
  title: string;
}

export function PackageGallery({ images, title }: PackageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  // Quantidade de imagens a mostrar na grid (máx 5, resto fica no +X)
  const maxVisible = 5;
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  return (
    <>
      {/* Grid de Imagens */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {visibleImages.map((image, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className={cn(
              "relative aspect-[4/3] rounded-lg overflow-hidden group",
              index === 0 && "md:col-span-2 md:row-span-2"
            )}
          >
            <Image
              src={image}
              alt={`${title} - Foto ${index + 1}`}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            
            {/* Mostrar contador no último item se houver mais imagens */}
            {index === maxVisible - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{remainingCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Botão Fechar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navegação */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Imagem Principal */}
          <div 
            className="relative w-full max-w-5xl h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex]}
              alt={`${title} - Foto ${selectedIndex + 1}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>

          {/* Contador */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
                className={cn(
                  "relative w-16 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all",
                  selectedIndex === index
                    ? "border-white ring-2 ring-white/50"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={image}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
