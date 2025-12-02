'use client';

import { Package } from '@/types';
import { MapPin, Calendar, Users, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PackageCardProps {
  package: Package;
  variant?: 'default' | 'featured';
}

export function PackageCard({ package: pkg, variant = 'default' }: PackageCardProps) {
  const isFeatured = variant === 'featured' || pkg.isFeatured;
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round(((pkg.originalPrice! - pkg.price) / pkg.originalPrice!) * 100)
    : 0;

  return (
    <Link href={`/pacotes/${pkg.slug}`} className="h-full">
      <div className={`group relative overflow-hidden rounded-xl border transition-smooth hover:shadow-xl h-full flex flex-col ${
        isFeatured ? 'border-accent bg-gradient-to-br from-primary/5 to-accent/5' : 'border-border bg-card'
      }`}>
        {/* Badge Destaque */}
        {isFeatured && (
          <div className="absolute top-4 left-4 z-10 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
            Destaque
          </div>
        )}

        {/* Badge Desconto */}
        {hasDiscount && (
          <div className="absolute top-4 right-4 z-10 bg-destructive text-white px-3 py-1 rounded-full text-xs font-semibold">
            -{discountPercent}%
          </div>
        )}

        {/* Imagem */}
        <div className="relative h-56 overflow-hidden bg-muted">
          <Image
            src={pkg.coverImage}
            alt={pkg.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Vagas Limitadas */}
          {pkg.availableSeats <= 5 && pkg.availableSeats > 0 && (
            <div className="absolute bottom-4 left-4 bg-destructive/90 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Apenas {pkg.availableSeats} vagas!
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 flex-1 flex flex-col">
          {/* Título */}
          <div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {pkg.title}
            </h3>
            {pkg.shortDescription && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {pkg.shortDescription}
              </p>
            )}
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{pkg.destination?.city}, {pkg.destination?.state}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>{pkg.durationDays} {pkg.durationDays === 1 ? 'dia' : 'dias'}</span>
            </div>
            {pkg.departureDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{new Date(pkg.departureDate).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>{pkg.availableSeats} vagas</span>
            </div>
          </div>

          {/* Incluso */}
          {pkg.includes && pkg.includes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pkg.includes.slice(0, 3).map((item, i) => (
                <span
                  key={i}
                  className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
                >
                  {item}
                </span>
              ))}
              {pkg.includes.length > 3 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{pkg.includes.length - 3} mais
                </span>
              )}
            </div>
          )}

          {/* Preço e CTA */}
          <div className="flex items-end justify-between pt-4 border-t mt-auto">
            <div>
              {hasDiscount && (
                <p className="text-sm text-muted-foreground line-through">
                  R$ {(pkg.originalPrice! / 100).toFixed(2)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="text-2xl font-bold text-primary">
                R$ {(pkg.price / 100).toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">/pessoa</span>
              </p>
            </div>
            <button className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-smooth">
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
