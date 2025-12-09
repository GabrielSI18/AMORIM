'use client';

import { useEffect, useState } from 'react';
import { BusSeatMap, BusSeatMapCompact, BusInfo } from './bus-seat-map';

interface PackageSeatsData {
  packageId: string;
  packageTitle: string;
  totalSeats: number;
  occupiedSeats: number[];
  availableSeats: number;
  totalBookings: number;
  totalParticipants: number;
  bus?: BusInfo | null;
}

interface PackageSeatsDisplayProps {
  packageId: string;
  totalSeats?: number;
  variant?: 'full' | 'compact';
}

export function PackageSeatsDisplay({
  packageId,
  totalSeats: initialTotalSeats,
  variant = 'full',
}: PackageSeatsDisplayProps) {
  const [data, setData] = useState<PackageSeatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeats() {
      try {
        const response = await fetch(`/api/packages/${packageId}/seats`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar assentos');
        }

        const seatsData = await response.json();
        setData(seatsData);
      } catch (err) {
        console.error('Erro ao buscar assentos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchSeats();
  }, [packageId]);

  if (loading) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-muted rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-card border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex justify-center gap-1">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="w-6" />
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="w-10 h-10 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-center text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  // Fallback para totalSeats se API não retornar
  const totalSeats = data.totalSeats || initialTotalSeats || 0;

  if (totalSeats === 0) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-center text-sm text-muted-foreground">
        Informação de assentos não disponível
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <BusSeatMapCompact
        totalSeats={totalSeats}
        occupiedSeats={data.occupiedSeats}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {data.bus ? `Nosso Veículo: ${data.bus.model}` : 'Mapa de Assentos'}
      </h3>
      <BusSeatMap
        totalSeats={totalSeats}
        occupiedSeats={data.occupiedSeats}
        readonly
        showLegend
        bus={data.bus}
      />
    </div>
  );
}
