'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Bus, Edit2, Trash2, Eye, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell, AdminGuard } from '@/components/dashboard';

interface BusData {
  id: string;
  model: string;
  year: number;
  plate: string;
  seats: number;
  floors: number;
  photos: string[];
  isActive: boolean;
  createdAt: string;
}

export default function FrotaPage() {
  return (
    <AdminGuard>
      <FrotaContent />
    </AdminGuard>
  );
}

function FrotaContent() {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    try {
      const response = await fetch('/api/fleet');
      if (!response.ok) throw new Error('Erro ao carregar frota');
      const data = await response.json();
      setBuses(data.data);
    } catch (error) {
      console.error('Erro ao carregar frota:', error);
      toast.error('Erro ao carregar frota');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este ônibus?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/fleet/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao remover ônibus');
      
      const result = await response.json();
      
      if (result.softDeleted) {
        toast.success('Ônibus desativado (possui pacotes associados)');
        // Atualizar status na lista
        setBuses(prev => prev.map(bus => 
          bus.id === id ? { ...bus, isActive: false } : bus
        ));
      } else {
        toast.success('Ônibus removido com sucesso');
        setBuses(prev => prev.filter(bus => bus.id !== id));
      }
    } catch (error) {
      console.error('Erro ao remover ônibus:', error);
      toast.error('Erro ao remover ônibus');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBuses = buses.filter(bus =>
    bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardShell title="Frota">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Frota">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <p className="text-muted-foreground">Gerencie os ônibus da sua frota</p>
        <Link
          href="/dashboard/frota/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Ônibus
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por modelo ou placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Lista de Ônibus */}
      {filteredBuses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm ? 'Nenhum ônibus encontrado' : 'Nenhum ônibus cadastrado'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Tente buscar por outro termo' 
              : 'Comece cadastrando o primeiro ônibus da sua frota'}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/frota/novo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Ônibus
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuses.map((bus) => (
            <div
              key={bus.id}
              className={`bg-card rounded-xl border border-border overflow-hidden transition-all hover:shadow-md ${
                !bus.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Foto principal */}
              <div className="relative h-40 bg-muted">
                {bus.photos && bus.photos.length > 0 ? (
                  <Image
                    src={bus.photos[0]}
                    alt={bus.model}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Bus className="w-16 h-16 text-muted-foreground/50" />
                  </div>
                )}
                {!bus.isActive && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded">
                    Inativo
                  </div>
                )}
                {bus.floors > 1 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                    Double Decker
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground truncate">{bus.model}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{bus.year}</span>
                  <span className="font-mono">{bus.plate}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                    <Bus className="w-3 h-3" />
                    {bus.seats} assentos
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                    {bus.floors} andar{bus.floors > 1 ? 'es' : ''}
                  </span>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/dashboard/frota/${bus.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </Link>
                  <Link
                    href={`/dashboard/frota/${bus.id}/editar`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(bus.id)}
                    disabled={deletingId === bus.id}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === bus.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
