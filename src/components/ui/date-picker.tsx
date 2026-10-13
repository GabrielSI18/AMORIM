'use client'

/**
 * Seletor de data com a identidade visual do site.
 *
 * O `<input type="date">` abre o calendário nativo do navegador, que não
 * aceita estilo nenhum (e muda de cara em cada navegador). Este componente
 * mantém a mesma API — valor e onChange em "YYYY-MM-DD" — para entrar no
 * lugar dele sem mexer no estado dos formulários.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  /** Valor no formato YYYY-MM-DD (igual ao input nativo) */
  value: string
  onChange: (value: string) => void
  /** Menor data selecionável (YYYY-MM-DD) */
  min?: string
  /** Maior data selecionável (YYYY-MM-DD) */
  max?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  /** Texto do botão que limpa a data; some quando o campo é obrigatório */
  clearLabel?: string
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** "YYYY-MM-DD" -> partes numéricas (sem passar por Date, que aplica fuso) */
function parse(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) }
}

function toValue(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function format(value: string): string {
  const parts = parse(value)
  if (!parts) return ''
  return `${String(parts.day).padStart(2, '0')}/${String(parts.month + 1).padStart(2, '0')}/${parts.year}`
}

function todayValue(): string {
  const now = new Date()
  return toValue(now.getFullYear(), now.getMonth(), now.getDate())
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  required,
  disabled,
  id,
  name,
  className,
  clearLabel = 'Limpar',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = parse(value)
  const today = parse(todayValue())!
  const [view, setView] = useState(() => ({
    year: selected?.year ?? today.year,
    month: selected?.month ?? today.month,
  }))

  // Reabrir sempre no mês da data escolhida
  useEffect(() => {
    if (open && selected) setView({ year: selected.year, month: selected.month })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const years = useMemo(() => {
    const first = (min ? parse(min)?.year : undefined) ?? today.year - 100
    const last = (max ? parse(max)?.year : undefined) ?? today.year + 5
    return Array.from({ length: Math.max(1, last - first + 1) }, (_, i) => first + i)
  }, [min, max, today.year])

  const days = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay()
    const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate()
    const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day)
    return cells
  }, [view])

  const isDisabled = (day: number) => {
    const current = toValue(view.year, view.month, day)
    if (min && current < min) return true
    if (max && current > max) return true
    return false
  }

  const goMonth = (delta: number) => {
    setView((prev) => {
      const month = prev.month + delta
      if (month < 0) return { year: prev.year - 1, month: 11 }
      if (month > 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month }
    })
  }

  const select = (day: number) => {
    onChange(toValue(view.year, view.month, day))
    setOpen(false)
  }

  const selectControl =
    'bg-transparent text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1 py-0.5 cursor-pointer'

  return (
    <div ref={containerRef} className="relative">
      {/* valor real, para validação nativa de campo obrigatório */}
      <input type="hidden" id={id} name={name} value={value} required={required} readOnly />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted border border-border rounded-lg text-left transition',
          'focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed',
          open && 'border-primary',
          className
        )}
      >
        <span className={cn('text-sm', value ? 'text-foreground' : 'text-muted-foreground')}>
          {value ? format(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Escolha uma data"
          className="absolute z-50 mt-2 w-[18rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              aria-label="Mês anterior"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <select
                aria-label="Mês"
                value={view.month}
                onChange={(e) => setView((prev) => ({ ...prev, month: Number(e.target.value) }))}
                className={selectControl}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                aria-label="Ano"
                value={view.year}
                onChange={(e) => setView((prev) => ({ ...prev, year: Number(e.target.value) }))}
                className={selectControl}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => goMonth(1)}
              aria-label="Próximo mês"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((weekday, index) => (
              <span
                key={`${weekday}-${index}`}
                className="h-7 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />

              const current = toValue(view.year, view.month, day)
              const isSelected = current === value
              const isToday = current === todayValue()
              const disabledDay = isDisabled(day)

              return (
                <button
                  key={current}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => select(day)}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn(
                    'h-9 rounded-lg text-sm transition',
                    'hover:bg-primary/10 hover:text-primary',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold',
                    !isSelected && isToday && 'border border-primary/50 text-primary font-semibold',
                    !isSelected && !isToday && 'text-foreground',
                    disabledDay && 'opacity-30 pointer-events-none'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
            {!required ? (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition"
              >
                {clearLabel}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                const now = todayValue()
                if ((!min || now >= min) && (!max || now <= max)) {
                  onChange(now)
                  setOpen(false)
                } else {
                  setView({ year: today.year, month: today.month })
                }
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
