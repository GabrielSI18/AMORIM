'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Bus, Edit2, Trash2, Loader2, Calendar, Hash, Users, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard';

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

interface BusPageProps {
  params: Promise<{ busId: string }>;
}

export default function BusViewPage({ params }: BusPageProps) {
  const router = useRouter();
  const [busId, setBusId] = useState<string>('');
  const [bus, setBus] = useState<BusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    params.then(p => setBusId(p.busId));
  }, [params]);

  useEffect(() => {
    if (busId) {
      loadBus();
    }
  }, [busId]);

  const loadBus = async () => {
    try {
      const response = await fetch(`/api/fleet/${busId}`);
      if (!response.ok) throw new Error('Ônibus não encontrado');
      const data = await response.json();
      setBus(data.data);
    } catch (error) {
      console.error('Erro ao carregar ônibus:', error);
      toast.error('Ônibus não encontrado');
      router.push('/dashboard/frota');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover este ônibus?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/fleet/${busId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao remover ônibus');
      
      toast.success('Ônibus removido com sucesso');
      router.push('/dashboard/frota');
    } catch (error) {
      console.error('Erro ao remover ônibus:', error);
      toast.error('Erro ao remover ônibus');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell title="Carregando...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!bus) {
    return (
      <DashboardShell title="Ônibus não encontrado">
        <div className="text-center py-12">
          <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Ônibus não encontrado</p>
          <Link
            href="/dashboard/frota"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Voltar para Frota
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={bus.model}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/frota"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Frota
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/frota/${busId}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Remover
            </button>
          </div>
        </div>

        {/* Galeria de Fotos */}
        {bus.photos && bus.photos.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Foto Principal */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-muted">
              <Image
                src={bus.photos[activePhoto]}
                alt={`${bus.model} - Foto ${activePhoto + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              {bus.floors > 1 && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-lg">
                  Double Decker
                </div>
              )}
              {!bus.isActive && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-destructive text-destructive-foreground text-sm font-semibold rounded-lg">
                  Inativo
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {bus.photos.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {bus.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhoto(index)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activePhoto === index
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`Miniatura ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados do Veículo */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Dados do Veículo</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium text-foreground">{bus.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-medium text-foreground">{bus.year}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium text-foreground font-mono">{bus.plate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Capacidade */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Capacidade</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assentos</p>
                  <p className="font-medium text-foreground">{bus.seats} lugares</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Andares</p>
                  <p className="font-medium text-foreground">{bus.floors} andar{bus.floors > 1 ? 'es' : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Status</h2>
          <div className="flex items-center gap-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              bus.isActive
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-destructive/10 text-destructive'
            }`}>
              <div className={`w-2 h-2 rounded-full ${bus.isActive ? 'bg-emerald-500' : 'bg-destructive'}`} />
              {bus.isActive ? 'Ativo' : 'Inativo'}
            </div>
            <span className="text-sm text-muted-foreground">
              Cadastrado em {new Date(bus.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
