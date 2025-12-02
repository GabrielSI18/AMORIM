'use client';

import { useState } from 'react';
import { Category, Destination } from '@/types';
import { Search } from 'lucide-react';

interface PackageFiltersProps {
  categories?: Category[];
  destinations?: Destination[];
  onFilterChange: (filters: {
    category?: string;
    destination?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) => void;
}

export function PackageFilters({ categories, destinations, onFilterChange }: PackageFiltersProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [destination, setDestination] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      search: search || undefined,
      category: category || undefined,
      destination: destination || undefined,
      minPrice: minPrice ? Number(minPrice) * 100 : undefined, // converter para centavos
      maxPrice: maxPrice ? Number(maxPrice) * 100 : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setDestination('');
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({});
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">Filtrar Pacotes</h3>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por destino, título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Categoria */}
      {categories && categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Destino */}
      {destinations && destinations.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Destino</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos os destinos</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.id}>
                {dest.city}, {dest.state}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Preço */}
      <div>
        <label className="block text-sm font-medium mb-2">Faixa de Preço</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Mín (R$)"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Máx (R$)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleApplyFilters}
          className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-smooth"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-smooth"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
