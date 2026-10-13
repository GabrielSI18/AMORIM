/**
 * Datas vindas de formulários (`<input type="date">`) chegam como "2026-11-11".
 * `new Date('2026-11-11')` vira meia-noite UTC, que no horário de Brasília é
 * 21h do dia ANTERIOR — por isso a data aparecia um dia a menos no site.
 * Guardamos sempre ao meio-dia UTC, que cai no mesmo dia em qualquer fuso do Brasil.
 */
export function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0))
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
