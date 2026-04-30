'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';

export interface BusInfo {
  id: string;
  model: string;
  // `year` e `plate` são opcionais: a API pública não os retorna (admin sim)
  year?: number;
  plate?: string;
  seats: number;
  floors: number;
  photos: string[];
}

interface BusSeatMapProps {
  totalSeats: number;
  occupiedSeats?: number[];
  selectedSeats?: number[];
  maxSelectable?: number;
  onSelectionChange?: (seats: number[]) => void;
  readonly?: boolean;
  showLegend?: boolean;
  bus?: BusInfo | null;
}

type SeatStatus = 'available' | 'occupied' | 'selected';
type SpecialCell = 'bathroom' | 'fridge' | 'stairs' | 'refrigerator';
type CellContent = number | SpecialCell | null;

interface SeatRow {
  leftWindow: CellContent;
  leftAisle: CellContent;
  rightAisle: CellContent;
  rightWindow: CellContent;
}

interface FloorLayout {
  label: string;
  rows: SeatRow[];
  hasFrigobar?: boolean;
  hasBathroomTop?: boolean; // banheiro no topo (piso inferior DD)
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function singleFloorLayout(totalSeats: number): FloorLayout {
  const rows: SeatRow[] = [];

  if (totalSeats === 46) {
    // Fileiras 1-11: fórmula padrão LJ=4r-3, LC=4r-2, CD=4r, CJ=4r-1
    for (let r = 1; r <= 11; r++) {
      rows.push({ leftWindow: 4 * r - 3, leftAisle: 4 * r - 2, rightAisle: 4 * r, rightWindow: 4 * r - 1 });
    }
    // Fileira 12: 45,46 na esquerda; BANHEIRO na direita
    rows.push({ leftWindow: 45, leftAisle: 46, rightAisle: 'bathroom', rightWindow: null });
    return { label: 'Ônibus', rows, hasFrigobar: true };
  }

  // Layout genérico: 2+2 sequencial com a direita revertida por fileira
  const fullRows = Math.floor(totalSeats / 4);
  for (let r = 1; r <= fullRows; r++) {
    rows.push({ leftWindow: 4 * r - 3, leftAisle: 4 * r - 2, rightAisle: 4 * r, rightWindow: 4 * r - 1 });
  }
  const remainder = totalSeats - fullRows * 4;
  if (remainder > 0) {
    const base = fullRows * 4;
    rows.push({
      leftWindow: base + 1 <= totalSeats ? base + 1 : null,
      leftAisle: base + 2 <= totalSeats ? base + 2 : null,
      rightAisle: base + 4 <= totalSeats ? base + 4 : null,
      rightWindow: base + 3 <= totalSeats ? base + 3 : null,
    });
  }
  return { label: 'Ônibus', rows };
}

function upperDDLayout(isDD64: boolean): FloorLayout {
  const rows: SeatRow[] = [];

  // Seção pré-escada: fileiras 1-3 (assentos 1-12)
  for (let r = 1; r <= 3; r++) {
    rows.push({ leftWindow: 4 * r - 3, leftAisle: 4 * r - 2, rightAisle: 4 * r, rightWindow: 4 * r - 1 });
  }
  // Fileira 4: 13,14 esq + ESCADA dir
  rows.push({ leftWindow: 13, leftAisle: 14, rightAisle: 'stairs', rightWindow: null });
  // Fileira 5: 15,16 esq + GELADEIRA dir
  rows.push({ leftWindow: 15, leftAisle: 16, rightAisle: 'refrigerator', rightWindow: null });

  if (isDD64) {
    // DD-64: 8 fileiras principais, assentos 17-48
    // LJ=4i+13, LC=4i+14, CD=4i+16, CJ=4i+15
    for (let i = 1; i <= 8; i++) {
      rows.push({ leftWindow: 4 * i + 13, leftAisle: 4 * i + 14, rightAisle: 4 * i + 16, rightWindow: 4 * i + 15 });
    }
  } else {
    // DD-55: 7 fileiras principais (assentos 17-44), + fileira parcial final (45,46)
    // LJ=4i+15, LC=4i+16, CD=4i+14, CJ=4i+13
    for (let i = 1; i <= 7; i++) {
      rows.push({ leftWindow: 4 * i + 15, leftAisle: 4 * i + 16, rightAisle: 4 * i + 14, rightWindow: 4 * i + 13 });
    }
    // Fileira parcial: só direita (46, 45)
    rows.push({ leftWindow: null, leftAisle: null, rightAisle: 46, rightWindow: 45 });
  }

  return { label: 'Piso Superior', rows };
}

function lowerDD55Layout(): FloorLayout {
  // Assentos 47-55: 3 fileiras, esq=2, dir=1 assento
  return {
    label: 'Piso Inferior',
    hasBathroomTop: true,
    rows: [
      { leftWindow: 47, leftAisle: 48, rightAisle: 49, rightWindow: null },
      { leftWindow: 50, leftAisle: 51, rightAisle: 52, rightWindow: null },
      { leftWindow: 53, leftAisle: 54, rightAisle: 55, rightWindow: null },
    ],
  };
}

function lowerDD64Layout(): FloorLayout {
  // Assentos 49-64: 4 fileiras 2+2
  // LJ=4r+45, LC=4r+46, CD=4r+48, CJ=4r+47
  const rows: SeatRow[] = [];
  for (let r = 1; r <= 4; r++) {
    rows.push({ leftWindow: 4 * r + 45, leftAisle: 4 * r + 46, rightAisle: 4 * r + 48, rightWindow: 4 * r + 47 });
  }
  return { label: 'Piso Inferior', hasBathroomTop: true, rows };
}

function getFloorLayouts(floors: number, seats: number): FloorLayout[] {
  if (floors === 2) {
    if (seats === 64) return [upperDDLayout(true), lowerDD64Layout()];
    if (seats === 55) return [upperDDLayout(false), lowerDD55Layout()];
    // DD genérico: trata como DD-55 se seats <= 55, senão DD-64
    return seats <= 55 ? [upperDDLayout(false), lowerDD55Layout()] : [upperDDLayout(true), lowerDD64Layout()];
  }
  return [singleFloorLayout(seats)];
}

// ─── Render special cell ──────────────────────────────────────────────────────

function SpecialCellBlock({ type, span = 1 }: { type: SpecialCell; span?: number }) {
  const configs: Record<SpecialCell, { label: string; className: string }> = {
    bathroom:     { label: 'BANHEIRO',   className: 'bg-sky-100 border-sky-400 text-sky-700 dark:bg-sky-900/40 dark:border-sky-500 dark:text-sky-300' },
    fridge:       { label: 'FRIGOBAR',   className: 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-300' },
    stairs:       { label: 'ESCADA',     className: 'bg-violet-100 border-violet-400 text-violet-700 dark:bg-violet-900/40 dark:border-violet-500 dark:text-violet-300' },
    refrigerator: { label: 'GELADEIRA',  className: 'bg-teal-100 border-teal-400 text-teal-700 dark:bg-teal-900/40 dark:border-teal-500 dark:text-teal-300' },
  };
  const { label, className } = configs[type];
  const width = span === 2 ? 'w-[5.75rem]' : 'w-11';
  return (
    <div className={cn('h-11 rounded-md border-2 flex items-center justify-center text-[9px] font-bold', width, className)}>
      {label}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusSeatMap({
  totalSeats,
  occupiedSeats = [],
  selectedSeats: initialSelected = [],
  maxSelectable = 0,
  onSelectionChange,
  readonly = false,
  showLegend = true,
  bus,
}: BusSeatMapProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>(initialSelected);
  const [activeFloor, setActiveFloor] = useState(0);

  useEffect(() => {
    setSelectedSeats(initialSelected);
  }, [initialSelected]);

  const floors = bus?.floors ?? 1;
  const seats = bus?.seats ?? totalSeats;
  const floorLayouts = getFloorLayouts(floors, seats);
  const currentFloor = floorLayouts[activeFloor] ?? floorLayouts[0];

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
      newSelected = selectedSeats.filter((s) => s !== seatNumber);
    } else {
      if (maxSelectable > 0 && selectedSeats.length >= maxSelectable) return;
      newSelected = [...selectedSeats, seatNumber].sort((a, b) => a - b);
    }
    setSelectedSeats(newSelected);
    onSelectionChange?.(newSelected);
  };

  const getSeatStyles = (status: SeatStatus) => {
    const base = 'w-11 h-11 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-semibold transition-all duration-200 border-2 shadow-sm';
    switch (status) {
      case 'available':
        return cn(base, 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-300',
          !readonly && 'hover:bg-emerald-100 dark:hover:bg-emerald-800/50 cursor-pointer hover:scale-110 hover:shadow-md');
      case 'occupied':
        return cn(base, 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed');
      case 'selected':
        return cn(base, 'bg-primary border-primary text-primary-foreground shadow-lg scale-110 ring-2 ring-primary/30',
          !readonly && 'cursor-pointer hover:opacity-90');
    }
  };

  const renderCell = (cell: CellContent, key: string) => {
    if (cell === null) return <div key={key} className="w-11 h-11" />;
    if (typeof cell === 'string') return <SpecialCellBlock key={key} type={cell as SpecialCell} />;
    const status = getSeatStatus(cell);
    return (
      <button
        key={key}
        type="button"
        onClick={() => handleSeatClick(cell)}
        disabled={readonly || status === 'occupied'}
        className={getSeatStyles(status)}
        title={status === 'occupied' ? `Assento ${cell} - Ocupado` : status === 'selected' ? `Assento ${cell} - Selecionado` : `Assento ${cell} - Disponível`}
      >
        {cell}
      </button>
    );
  };

  // Renderiza a célula direita: se rightAisle é bathroom com span=2, ocupa as 2 células  
  const renderRightSide = (row: SeatRow, rowIdx: number) => {
    if (row.rightAisle === 'bathroom' && row.rightWindow === null) {
      return <SpecialCellBlock key={`rs-${rowIdx}`} type="bathroom" span={2} />;
    }
    if (row.rightAisle === 'stairs' && row.rightWindow === null) {
      return <SpecialCellBlock key={`rs-${rowIdx}`} type="stairs" span={2} />;
    }
    if (row.rightAisle === 'refrigerator' && row.rightWindow === null) {
      return <SpecialCellBlock key={`rs-${rowIdx}`} type="refrigerator" span={2} />;
    }
    return (
      <div key={`rs-${rowIdx}`} className="flex gap-1">
        {renderCell(row.rightAisle, `rsa-${rowIdx}`)}
        {renderCell(row.rightWindow, `rsw-${rowIdx}`)}
      </div>
    );
  };

  const availableCount = totalSeats - occupiedSeats.length;
  const selectedCount = selectedSeats.length;

  // Altura uniforme entre pisos: cada linha tem ~50px (h-11 + gap)
  const maxRows = Math.max(...floorLayouts.map((f) => f.rows.length));

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs de andares (DD) */}
      {floorLayouts.length > 1 && (
        <div className="flex gap-2 justify-center">
          {floorLayouts.map((fl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveFloor(idx)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all',
                activeFloor === idx
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary'
              )}
            >
              {fl.label}
            </button>
          ))}
        </div>
      )}

      {/* Container do Ônibus */}
      <div className="relative mx-auto min-w-[272px]">
        <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] border-4 border-slate-400 dark:border-slate-600 shadow-xl overflow-hidden">

          {/* Frente do Ônibus — só no piso frontal */}
          {!currentFloor.hasBathroomTop ? (
            <div className="relative bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 pt-4 pb-2 px-4 border-b-2 border-slate-400 dark:border-slate-600">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-400 dark:bg-amber-500 px-6 py-0.5 rounded-b-lg text-xs font-bold text-slate-800">
                TURISMO
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="w-3 h-6 bg-slate-500 dark:bg-slate-400 rounded-sm -ml-1 shadow-md" />
                <div className="flex items-center gap-3 absolute left-8">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-slate-400 dark:bg-slate-500 border-2 border-slate-500 dark:border-slate-400 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">Motorista</span>
                  </div>
                </div>
                <div className="w-3 h-6 bg-slate-500 dark:bg-slate-400 rounded-sm -mr-1 shadow-md" />
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent dark:via-sky-400/30 rounded-full" />
            </div>
          ) : (
            /* Piso Inferior — indicador de escada/entrada traseira */
            <div className="relative bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 pt-3 pb-2 px-4 border-b-2 border-slate-400 dark:border-slate-600 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">ESCADA — PISO SUPERIOR</span>
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          )}

          {/* Área dos Passageiros */}
          <div className="px-3 py-4">
            {/* Fileiras — justify-end empurra para o fundo no piso inferior */}
            <div className="flex flex-col justify-end gap-1.5 px-2" style={{ minHeight: `${maxRows * 50}px` }}>
              {/* Banheiro imediatamente acima das poltronas (piso inferior DD) */}
              {currentFloor.hasBathroomTop && (
                <div className="flex justify-start">
                  <SpecialCellBlock type="bathroom" span={2} />
                </div>
              )}
              {currentFloor.rows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center justify-center gap-1">
                  {/* Esquerda */}
                  <div className="flex gap-1">
                    {renderCell(row.leftWindow, `lw-${rowIdx}`)}
                    {renderCell(row.leftAisle, `la-${rowIdx}`)}
                  </div>
                  {/* Corredor */}
                  <div className="w-10 flex items-center justify-center">
                    <div className="w-full h-1 bg-slate-300/50 dark:bg-slate-600/50 rounded-full" />
                  </div>
                  {/* Direita */}
                  {renderRightSide(row, rowIdx)}
                </div>
              ))}
            </div>

            {/* Frigobar no fundo */}
            {currentFloor.hasFrigobar && (
              <div className="flex justify-center mt-2">
                <SpecialCellBlock type="fridge" span={2} />
              </div>
            )}
          </div>

          {/* Traseira do Ônibus */}
          <div className="bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 py-2 px-4 border-t-2 border-slate-400 dark:border-slate-600 rounded-b-xl flex items-center justify-center">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-widest">TRASEIRA</span>
          </div>
        </div>
      </div>

      {/* Legenda */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center text-sm mt-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-md rounded-b-sm bg-emerald-50 border-2 border-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-500" />
            <span className="text-muted-foreground">Disponível ({availableCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-t-md rounded-b-sm bg-gray-100 border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600" />
            <span className="text-muted-foreground">Ocupado ({occupiedSeats.length})</span>
          </div>
          {!readonly && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-t-md rounded-b-sm bg-primary border-2 border-primary" />
              <span className="text-muted-foreground">Selecionado ({selectedCount})</span>
            </div>
          )}
        </div>
      )}

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
