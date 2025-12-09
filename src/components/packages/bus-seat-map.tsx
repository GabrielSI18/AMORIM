'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';

interface BusSeatMapProps {
  totalSeats: number;
  occupiedSeats?: number[];
  selectedSeats?: number[];
  maxSelectable?: number;
  onSelectionChange?: (seats: number[]) => void;
  readonly?: boolean;
  showLegend?: boolean;
}

type SeatStatus = 'available' | 'occupied' | 'selected';

export function BusSeatMap({
  totalSeats,
  occupiedSeats = [],
  selectedSeats: initialSelected = [],
  maxSelectable = 0,
  onSelectionChange,
  readonly = false,
  showLegend = true,
}: BusSeatMapProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>(initialSelected);

  // Sincroniza com prop externa
  useEffect(() => {
    setSelectedSeats(initialSelected);
  }, [initialSelected]);

  // Calcula número de fileiras (2+2 = 4 assentos por fileira)
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  const getSeatStatus = useCallback(
    (seatNumber: number): SeatStatus => {
      if (occupiedSeats.includes(seatNumber)) return 'occupied';
      if (selectedSeats.includes(seatNumber)) return 'selected';
      return 'available';
    },
    [occupiedSeats, selectedSeats]
  );

  const handleSeatClick = (seatNumber: number) => {
    if (readonly) return;
    if (occupiedSeats.includes(seatNumber)) return;

    let newSelected: number[];

    if (selectedSeats.includes(seatNumber)) {
      // Desselecionar
      newSelected = selectedSeats.filter((s) => s !== seatNumber);
    } else {
      // Verificar limite
      if (maxSelectable > 0 && selectedSeats.length >= maxSelectable) {
        return;
      }
      newSelected = [...selectedSeats, seatNumber].sort((a, b) => a - b);
    }

    setSelectedSeats(newSelected);
    onSelectionChange?.(newSelected);
  };

  const getSeatStyles = (status: SeatStatus) => {
    const baseStyles =
      'w-9 h-9 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-semibold transition-all duration-200 border-2 shadow-sm';

    switch (status) {
      case 'available':
        return cn(
          baseStyles,
          'bg-emerald-50 border-emerald-400 text-emerald-700',
          'dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-300',
          !readonly && 'hover:bg-emerald-100 dark:hover:bg-emerald-800/50 cursor-pointer hover:scale-110 hover:shadow-md'
        );
      case 'occupied':
        return cn(
          baseStyles,
          'bg-gray-100 border-gray-300 text-gray-400',
          'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500',
          'cursor-not-allowed'
        );
      case 'selected':
        return cn(
          baseStyles,
          'bg-primary border-primary text-primary-foreground',
          'shadow-lg scale-110 ring-2 ring-primary/30',
          !readonly && 'cursor-pointer hover:opacity-90'
        );
    }
  };

  // Renderiza um assento
  const renderSeat = (seatNumber: number) => {
    if (seatNumber > totalSeats) {
      return <div key={`empty-${seatNumber}`} className="w-9 h-9" />;
    }

    const status = getSeatStatus(seatNumber);

    return (
      <button
        key={seatNumber}
        type="button"
        onClick={() => handleSeatClick(seatNumber)}
        disabled={readonly || status === 'occupied'}
        className={getSeatStyles(status)}
        title={
          status === 'occupied'
            ? `Assento ${seatNumber} - Ocupado`
            : status === 'selected'
              ? `Assento ${seatNumber} - Selecionado`
              : `Assento ${seatNumber} - Disponível`
        }
      >
        {seatNumber}
      </button>
    );
  };

  // Estatísticas
  const availableCount = totalSeats - occupiedSeats.length;
  const selectedCount = selectedSeats.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Container do Ônibus */}
      <div className="relative mx-auto">
        {/* Estrutura do Ônibus */}
        <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] border-4 border-slate-400 dark:border-slate-600 shadow-xl overflow-hidden">
          
          {/* Frente do Ônibus */}
          <div className="relative bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 pt-4 pb-2 px-4 border-b-2 border-slate-400 dark:border-slate-600">
            {/* Teto / Destino */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-400 dark:bg-amber-500 px-6 py-0.5 rounded-b-lg text-xs font-bold text-slate-800">
              TURISMO
            </div>
            
            {/* Painel frontal */}
            <div className="flex items-center justify-between mt-2">
              {/* Retrovisor esquerdo */}
              <div className="w-3 h-6 bg-slate-500 dark:bg-slate-400 rounded-sm -ml-1 shadow-md" />
              
              {/* Cabine do motorista (lado esquerdo) */}
              <div className="flex items-center gap-3 absolute left-8">
                {/* Motorista */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-slate-400 dark:bg-slate-500 border-2 border-slate-500 dark:border-slate-400 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">Motorista</span>
                </div>
              </div>
              
              {/* Retrovisor direito */}
              <div className="w-3 h-6 bg-slate-500 dark:bg-slate-400 rounded-sm -mr-1 shadow-md" />
            </div>
            
            {/* Para-brisa */}
            <div className="mt-2 h-1 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent dark:via-sky-400/30 rounded-full" />
          </div>

          {/* Área dos Passageiros */}
          <div className="px-3 py-4">
            {/* Janelas laterais (decoração) */}
            <div className="absolute left-0 top-[120px] bottom-8 w-2 flex flex-col justify-around py-2">
              {Array.from({ length: Math.min(rows, 8) }, (_, i) => (
                <div key={`window-left-${i}`} className="w-full h-6 bg-sky-200/60 dark:bg-sky-400/20 rounded-r-sm" />
              ))}
            </div>
            <div className="absolute right-0 top-[120px] bottom-8 w-2 flex flex-col justify-around py-2">
              {Array.from({ length: Math.min(rows, 8) }, (_, i) => (
                <div key={`window-right-${i}`} className="w-full h-6 bg-sky-200/60 dark:bg-sky-400/20 rounded-l-sm" />
              ))}
            </div>

            {/* Fileiras de assentos */}
            <div className="flex flex-col gap-1.5 px-2">
              {Array.from({ length: rows }, (_, rowIndex) => {
                const rowStart = rowIndex * seatsPerRow + 1;
                // Layout: 2 assentos | corredor | 2 assentos
                const leftSeats = [rowStart, rowStart + 1];
                const rightSeats = [rowStart + 2, rowStart + 3];

                return (
                  <div key={rowIndex} className="flex items-center justify-center gap-1">
                    {/* Lado esquerdo (2 assentos) */}
                    <div className="flex gap-1">
                      {leftSeats.map((seatNum) => renderSeat(seatNum))}
                    </div>

                    {/* Corredor */}
                    <div className="w-8 flex items-center justify-center">
                      <div className="w-full h-1 bg-slate-300/50 dark:bg-slate-600/50 rounded-full" />
                    </div>

                    {/* Lado direito (2 assentos) */}
                    <div className="flex gap-1">
                      {rightSeats.map((seatNum) => renderSeat(seatNum))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traseira do Ônibus */}
          <div className="relative bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 py-2 px-4 border-t-2 border-slate-400 dark:border-slate-600 rounded-b-xl">
          </div>
        </div>
      </div>

      {/* Legenda */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center text-sm mt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-emerald-50 border-2 border-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-500" />
            <span className="text-muted-foreground">Disponível ({availableCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-gray-100 border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600" />
            <span className="text-muted-foreground">Ocupado ({occupiedSeats.length})</span>
          </div>
          {!readonly && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-primary border-2 border-primary" />
              <span className="text-muted-foreground">Selecionado ({selectedCount})</span>
            </div>
          )}
        </div>
      )}

      {/* Info de seleção */}
      {!readonly && maxSelectable > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Selecione até <strong>{maxSelectable}</strong> assento(s) para sua reserva
        </p>
      )}
    </div>
  );
}

// Componente compacto para exibição em cards
export function BusSeatMapCompact({
  totalSeats,
  occupiedSeats = [],
}: {
  totalSeats: number;
  occupiedSeats?: number[];
}) {
  const availableCount = totalSeats - occupiedSeats.length;
  const occupancyPercent = (occupiedSeats.length / totalSeats) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Ícone do ônibus */}
      <div className="relative">
        <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
          <path d="M3 10h18" strokeWidth={1.5} />
          <circle cx="7" cy="18" r="1.5" fill="currentColor" />
          <circle cx="17" cy="18" r="1.5" fill="currentColor" />
          <rect x="5" y="7" width="2" height="2" rx="0.5" fill="currentColor" opacity={0.5} />
          <rect x="8" y="7" width="2" height="2" rx="0.5" fill="currentColor" opacity={0.5} />
          <rect x="14" y="7" width="2" height="2" rx="0.5" fill="currentColor" opacity={0.5} />
          <rect x="17" y="7" width="2" height="2" rx="0.5" fill="currentColor" opacity={0.5} />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">
            {availableCount} disponíveis
          </span>
          <span className="text-xs text-muted-foreground">
            {totalSeats} lugares
          </span>
        </div>
        {/* Barra de progresso */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              occupancyPercent >= 90 ? 'bg-red-500' :
              occupancyPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${100 - occupancyPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
