'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HotelGalleryProps {
  hotelName: string;
  photos: string[];
}

export function HotelGallery({ hotelName, photos }: HotelGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="bg-card rounded-xl p-6 shadow-card">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        {hotelName}
      </h2>

      {/* Slider Container */}
      <div className="relative">
        {/* Main Image */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
          <Image
            src={photos[currentIndex]}
            alt={`${hotelName} - Foto ${currentIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            unoptimized
          />

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto py-1">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 border-2",
                  currentIndex === index
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={photo}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
