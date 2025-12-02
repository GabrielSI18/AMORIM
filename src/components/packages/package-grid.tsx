'use client';

import { Package } from '@/types';
import { PackageCard } from './package-card';

interface PackageGridProps {
  packages: Package[];
  variant?: 'default' | 'featured';
}

export function PackageGrid({ packages, variant = 'default' }: PackageGridProps) {
  if (!packages || packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum pacote encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} package={pkg} variant={variant} />
      ))}
    </div>
  );
}
