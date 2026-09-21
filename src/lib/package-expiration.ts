/**
 * Encerramento automático de pacotes
 *
 * Um pacote sai do site público no dia seguinte à data de término (retorno;
 * se não tiver retorno, a data de saída). Pacotes sem nenhuma data nunca expiram.
 *
 * As datas são salvas como "dia" (meia-noite ou meio-dia UTC), então o dia do
 * pacote é o dia UTC da data, e o "hoje" é o dia no horário de Brasília.
 */

const TIMEZONE = 'America/Sao_Paulo'

/** Meia-noite UTC do dia de hoje no fuso de Brasília */
export function todayCutoff(now: Date = new Date()): Date {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .split('-')
    .map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/** Filtro Prisma: apenas pacotes que ainda não terminaram */
export function notExpiredWhere(now: Date = new Date()) {
  const cutoff = todayCutoff(now)
  return {
    OR: [
      { return_date: { gte: cutoff } },
      { return_date: null, departure_date: { gte: cutoff } },
      { return_date: null, departure_date: null },
    ],
  }
}

type PackageDates = {
  returnDate?: Date | string | null
  departureDate?: Date | string | null
  return_date?: Date | string | null
  departure_date?: Date | string | null
}

/** True se o pacote já terminou (aceita campos em camelCase ou snake_case) */
export function isPackageExpired(pkg: PackageDates, now: Date = new Date()): boolean {
  const end = pkg.returnDate ?? pkg.return_date ?? pkg.departureDate ?? pkg.departure_date
  if (!end) return false
  const endDay = new Date(end)
  const endUtcDay = Date.UTC(endDay.getUTCFullYear(), endDay.getUTCMonth(), endDay.getUTCDate())
  return endUtcDay < todayCutoff(now).getTime()
}
