'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/ui/header';
import { PackageGrid, PackageFilters } from '@/components/packages';
import { Spinner } from '@/components/ui/spinner';
import type { Package, Category, Destination } from '@/types';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    // Carregar dados iniciais
    Promise.all([
      fetch('/api/packages?status=published').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/destinations').then(r => r.json()),
    ])
      .then(([pkgData, catData, destData]) => {
        setPackages(pkgData.data || []);
        setCategories(catData.data || []);
        setDestinations(destData.data || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar dados:', err);
        setIsLoading(false);
      });
  }, []);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setIsLoading(true);

    // Construir query string
    const params = new URLSearchParams();
    params.append('status', 'published');
    
    if (newFilters.category) params.append('category', newFilters.category);
    if (newFilters.destination) params.append('destination', newFilters.destination);
    if (newFilters.minPrice) params.append('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.append('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.search) params.append('search', newFilters.search);

    fetch(`/api/packages?${params}`)
      .then(r => r.json())
      .then(data => {
        setPackages(data.data || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Erro ao filtrar pacotes:', err);
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container-custom">
          {/* Cabeçalho */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Nossos Pacotes de Viagem</h1>
            <p className="text-xl text-muted-foreground">
              Escolha o destino dos seus sonhos e embarque em uma aventura inesquecível
            </p>
          </div>

          {/* Grid com filtros + pacotes */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar com filtros */}
            <aside className="lg:col-span-1">
              <PackageFilters
                categories={categories}
                destinations={destinations}
                onFilterChange={handleFilterChange}
              />
            </aside>

            {/* Lista de pacotes */}
            <div className="lg:col-span-3">
              {/* Contador */}
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {isLoading ? 'Carregando...' : `${packages.length} pacote(s) encontrado(s)`}
                </p>
              </div>

              {/* Grid de cards */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" />
                </div>
              ) : (
                <PackageGrid packages={packages} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
