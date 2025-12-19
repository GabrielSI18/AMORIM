'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, MapPin, Calendar, Users, Star, 
  X, SlidersHorizontal, Clock, Bus
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { PublicLayout } from '@/components/layout';
import { useAffiliateTracking } from '@/hooks/use-affiliate-tracking';
import type { Package } from '@/types';

// Formatador de moeda
const formatPrice = (priceInCents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInCents / 100);
};

// Formatador de data
const formatDate = (date: Date | string | undefined) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Componente interno que usa useSearchParams (precisa de Suspense)
function PackagesContent() {
  // Rastrear código de afiliado da URL
  useAffiliateTracking();
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    duration: 'all',
    sortBy: 'featured',
  });

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'nordeste', name: 'Nordeste' },
    { id: 'sudeste', name: 'Sudeste' },
    { id: 'sul', name: 'Sul' },
    { id: 'norte', name: 'Norte' },
    { id: 'centro-oeste', name: 'Centro-Oeste' },
    { id: 'feriados', name: 'Feriados' },
    { id: 'reveillon', name: 'Réveillon' },
  ];

  const priceRanges = [
    { id: 'all', name: 'Qualquer preço' },
    { id: '0-500', name: 'Até R$ 500' },
    { id: '500-1000', name: 'R$ 500 - R$ 1.000' },
    { id: '1000-2000', name: 'R$ 1.000 - R$ 2.000' },
    { id: '2000+', name: 'Acima de R$ 2.000' },
  ];

  const durations = [
    { id: 'all', name: 'Qualquer duração' },
    { id: '1-3', name: '1 a 3 dias' },
    { id: '4-7', name: '4 a 7 dias' },
    { id: '8+', name: '8+ dias' },
  ];

  const sortOptions = [
    { id: 'featured', name: 'Destaques' },
    { id: 'price-asc', name: 'Menor preço' },
    { id: 'price-desc', name: 'Maior preço' },
    { id: 'date', name: 'Próximas saídas' },
  ];

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/packages?status=published');
      const data = await response.json();
      setPackages(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar e ordenar pacotes
  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Busca por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pkg => 
        pkg.title?.toLowerCase().includes(query) ||
        pkg.destination?.toString().toLowerCase().includes(query) ||
        pkg.description?.toLowerCase().includes(query)
      );
    }

    // Filtro por categoria
    if (filters.category !== 'all') {
      result = result.filter(pkg => 
        pkg.category?.slug === filters.category ||
        pkg.category?.name?.toLowerCase().includes(filters.category)
      );
    }

    // Filtro por preço
    if (filters.priceRange !== 'all') {
      const priceInReais = (cents: number) => cents / 100;
      result = result.filter(pkg => {
        const price = priceInReais(pkg.price);
        switch (filters.priceRange) {
          case '0-500': return price <= 500;
          case '500-1000': return price > 500 && price <= 1000;
          case '1000-2000': return price > 1000 && price <= 2000;
          case '2000+': return price > 2000;
          default: return true;
        }
      });
    }

    // Filtro por duração
    if (filters.duration !== 'all') {
      result = result.filter(pkg => {
        const days = pkg.durationDays || 0;
        switch (filters.duration) {
          case '1-3': return days >= 1 && days <= 3;
          case '4-7': return days >= 4 && days <= 7;
          case '8+': return days >= 8;
          default: return true;
        }
      });
    }

    // Ordenação
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'date':
        result.sort((a, b) => {
          if (!a.departureDate) return 1;
          if (!b.departureDate) return -1;
          return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
        });
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [packages, searchQuery, filters]);

  const hasActiveFilters = filters.category !== 'all' || filters.priceRange !== 'all' || filters.duration !== 'all';

  const clearFilters = () => {
    setFilters({
      category: 'all',
      priceRange: 'all',
      duration: 'all',
      sortBy: 'featured',
    });
    setSearchQuery('');
  };

  return (
    <PublicLayout currentPage="pacotes">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Encontre sua próxima aventura
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Descubra destinos incríveis com os melhores preços e conforto
            </p>

            {/* Barra de Busca */}
            <div className="relative max-w-2xl mx-auto">
              <div className="flex items-center bg-card border border-border rounded-full shadow-lg overflow-hidden">
                <div className="flex-1 flex items-center px-6 py-4">
                  <Search className="w-5 h-5 text-muted-foreground mr-3" />
                  <input
                    type="text"
                    placeholder="Para onde você quer ir?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-muted rounded-full">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-6 py-4 border-l border-border hover:bg-muted transition-colors ${showFilters ? 'bg-muted' : ''}`}
                >
                  <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros Expandidos */}
      {showFilters && (
        <section className="border-b border-border bg-card/50">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Região</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Faixa de Preço</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters(f => ({ ...f, priceRange: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {priceRanges.map(range => (
                    <option key={range.id} value={range.id}>{range.name}</option>
                  ))}
                </select>
              </div>

              {/* Duração */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Duração</label>
                <select
                  value={filters.duration}
                  onChange={(e) => setFilters(f => ({ ...f, duration: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {durations.map(dur => (
                    <option key={dur.id} value={dur.id}>{dur.name}</option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Ordenar por</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Limpar todos
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Chips de Categoria Rápida */}
      <section className="border-b border-border">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilters(f => ({ ...f, category: category.id }))}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.category === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Contagem de Resultados */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {isLoading ? 'Carregando...' : (
              <>
                <span className="font-semibold text-foreground">{filteredPackages.length}</span>
                {' '}pacote{filteredPackages.length !== 1 ? 's' : ''} encontrado{filteredPackages.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
          
          {/* Ordenação Mobile */}
          <div className="md:hidden">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredPackages.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum pacote encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Tente ajustar seus filtros ou buscar por outro destino
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          /* Grid de Pacotes */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPackages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/pacotes/${pkg.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                {/* Imagem */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {pkg.coverImage || pkg.galleryImages?.[0] ? (
                    <Image
                      src={pkg.coverImage || pkg.galleryImages?.[0]}
                      alt={pkg.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Bus className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {pkg.isFeatured && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                        <Star className="w-3 h-3 fill-current" /> Destaque
                      </span>
                    )}
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        {Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Data de saída */}
                  {pkg.departureDate && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(pkg.departureDate)}
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  {/* Destino */}
                  {pkg.destination && (
                    <p className="flex items-center gap-1 text-primary text-sm font-medium mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {typeof pkg.destination === 'string' ? pkg.destination : pkg.destination.city}
                    </p>
                  )}

                  {/* Título */}
                  <h3 className="text-foreground font-semibold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {pkg.title}
                  </h3>

                  {/* Detalhes */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    {pkg.durationDays && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {pkg.durationDays} dias
                      </span>
                    )}
                    {pkg.availableSeats && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {pkg.availableSeats} vagas
                      </span>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="flex items-end justify-between">
                    <div>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(pkg.originalPrice)}
                        </p>
                      )}
                      <p className="text-xl font-bold text-foreground">
                        {formatPrice(pkg.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">por pessoa</p>
                    </div>
                    <span className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg group-hover:bg-primary/90 transition-colors">
                      Ver mais
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {!isLoading && filteredPackages.length > 0 && (
          <section className="mt-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Não encontrou o que procurava?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Entre em contato conosco e montamos um pacote personalizado para você e seu grupo!
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              Fale conosco
            </Link>
          </section>
        )}
      </main>
    </PublicLayout>
  );
}

// Wrapper com Suspense para useSearchParams
export default function PackagesPage() {
  return (
    <Suspense fallback={
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    }>
      <PackagesContent />
    </Suspense>
  );
}
