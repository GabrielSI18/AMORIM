/**
 * Prisma falso, em memória, para a bateria de testes do programa de afiliados.
 *
 * Executa os handlers REAIS das rotas (src/app/api/...) sem encostar no banco
 * de produção: o `tests/tsconfig.json` aponta o alias `@/lib/prisma` para
 * este arquivo.
 *
 * Suporta o que as rotas usam de verdade: where com igualdade, `in`, `notIn`,
 * `OR`, select/include rasos, unique constraints e chave estrangeira do
 * booking → user (que é justamente onde um bug se esconde).
 */

type Row = Record<string, any>

export class PrismaKnownError extends Error {
  code: string
  meta: Record<string, unknown>
  constructor(code: string, message: string, meta: Record<string, unknown> = {}) {
    super(message)
    this.code = code
    this.meta = meta
  }
}

let seq = 0
const cuid = (prefix: string) => `${prefix}_${(++seq).toString().padStart(6, '0')}`

interface ModelSpec {
  /** campos com unique constraint */
  unique: string[]
  /** campo -> modelo referenciado (chave estrangeira obrigatória de existir) */
  foreign?: Record<string, { model: string; field: string }>
  prefix: string
}

const SPECS: Record<string, ModelSpec> = {
  user: { unique: ['id', 'clerk_id', 'email', 'cpf'], prefix: 'usr' },
  contact: { unique: ['id'], prefix: 'cnt' },
  package: { unique: ['id', 'slug'], prefix: 'pkg' },
  booking: {
    unique: ['id', 'stripe_payment_id'],
    foreign: { user_id: { model: 'user', field: 'id' }, package_id: { model: 'package', field: 'id' } },
    prefix: 'bkg',
  },
  passenger: { unique: ['id'], foreign: { booking_id: { model: 'booking', field: 'id' } }, prefix: 'psg' },
  affiliate: { unique: ['id', 'user_id', 'email', 'cpf', 'code'], prefix: 'aff' },
  affiliateReferral: {
    unique: ['id', 'booking_id'],
    foreign: { affiliate_id: { model: 'affiliate', field: 'id' } },
    prefix: 'ref',
  },
}

const DEFAULTS: Record<string, Row> = {
  user: { role: 'USER', source: 'clerk', clerk_id: null, cpf: null },
  contact: { status: 'pending', priority: 'normal', phone: null },
  booking: {
    status: 'pending',
    payment_status: 'pending',
    user_id: null,
    selected_seats: null,
    customer_cpf: null,
  },
  affiliate: {
    status: 'pending',
    commission_rate: 7,
    total_sales: 0,
    total_earned: 0,
    total_bookings: 0,
    user_id: null,
    cpf: null,
    pix_key: null,
    approved_at: null,
  },
  affiliateReferral: { commission_status: 'pending', commission_paid_at: null, booking_id: null },
  package: { total_seats: 0, available_seats: 0, bookings_count: 0 },
  passenger: {},
}

/** fila que serializa as transações interativas */
let transactionQueue: Promise<void> = Promise.resolve()

const store: Record<string, Row[]> = {}
for (const model of Object.keys(SPECS)) store[model] = []

/** Contagem de chamadas, para os testes verificarem N+1 / efeitos colaterais */
export const callLog: { model: string; op: string }[] = []

export function resetDb() {
  transactionQueue = Promise.resolve()
  for (const model of Object.keys(SPECS)) store[model] = []
  callLog.length = 0
  seq = 0
}

export function seed(model: string, rows: Row[]) {
  for (const row of rows) create(model, { data: row })
}

export function table(model: string): Row[] {
  return store[model]
}

// ─────────────────────────── matching ───────────────────────────

function matchValue(actual: any, expected: any): boolean {
  if (expected === null) return actual === null || actual === undefined
  if (expected !== null && typeof expected === 'object' && !(expected instanceof Date) && !Array.isArray(expected)) {
    if ('in' in expected) return (expected.in as any[]).includes(actual)
    if ('notIn' in expected) return !(expected.notIn as any[]).includes(actual)
    if ('not' in expected) return actual !== expected.not
    if ('gte' in expected) return actual != null && new Date(actual) >= new Date(expected.gte)
    if ('lte' in expected) return actual != null && new Date(actual) <= new Date(expected.lte)
    if ('contains' in expected) {
      const hay = String(actual ?? '')
      const needle = String(expected.contains)
      return expected.mode === 'insensitive'
        ? hay.toLowerCase().includes(needle.toLowerCase())
        : hay.includes(needle)
    }
    if ('equals' in expected) return actual === expected.equals
  }
  if (expected instanceof Date) return new Date(actual).getTime() === expected.getTime()
  return actual === expected
}

function matchWhere(row: Row, where: Row | undefined): boolean {
  if (!where) return true
  for (const [key, expected] of Object.entries(where)) {
    if (expected === undefined) continue
    if (key === 'OR') {
      // Prisma: um `{}` vazio dentro do OR casa com TUDO. Reproduzido de
      // propósito — é exatamente o comportamento que um dos testes cobra.
      const branches = expected as Row[]
      if (branches.length === 0) continue
      if (!branches.some((branch) => matchWhere(row, branch))) return false
      continue
    }
    if (key === 'AND') {
      if (!(expected as Row[]).every((branch) => matchWhere(row, branch))) return false
      continue
    }
    if (key === 'NOT') {
      if (matchWhere(row, expected as Row)) return false
      continue
    }
    if (!matchValue(row[key], expected)) return false
  }
  return true
}

function applySelect(row: Row, select?: Row, include?: Row, model?: string): Row {
  let out: Row
  if (select) {
    out = {}
    for (const [key, value] of Object.entries(select)) {
      if (!value) continue
      if (typeof value === 'object') {
        out[key] = relation(row, key, value as Row, model!)
      } else {
        out[key] = row[key]
      }
    }
    return out
  }
  out = { ...row }
  if (include) {
    for (const [key, value] of Object.entries(include)) {
      if (!value) continue
      out[key] = relation(row, key, typeof value === 'object' ? (value as Row) : {}, model!)
    }
  }
  return out
}

/** Relações conhecidas, declaradas à mão (o schema real é maior; só o que as rotas usam) */
function relation(row: Row, name: string, opts: Row, model: string): any {
  if (model === 'affiliate' && name === 'referrals') {
    let rows = store.affiliateReferral.filter((r) => r.affiliate_id === row.id)
    rows = sortRows(rows, opts.orderBy)
    if (opts.take) rows = rows.slice(0, opts.take)
    return rows.map((r) => applySelect(r, opts.select, opts.include, 'affiliateReferral'))
  }
  if (model === 'affiliate' && name === '_count') {
    const out: Row = {}
    const sel = (opts.select || {}) as Row
    if (sel.referrals) out.referrals = store.affiliateReferral.filter((r) => r.affiliate_id === row.id).length
    return out
  }
  if (model === 'affiliateReferral' && name === 'affiliate') {
    const aff = store.affiliate.find((a) => a.id === row.affiliate_id)
    return aff ? applySelect(aff, opts.select, opts.include, 'affiliate') : null
  }
  if (model === 'booking' && name === 'package') {
    const pkg = store.package.find((p) => p.id === row.package_id)
    if (!pkg) return null
    const out = applySelect(pkg, opts.select, opts.include, 'package')
    if (opts.include?.destination_rel || opts.select?.destination_rel) out.destination_rel = null
    if (opts.include?.category || opts.select?.category) out.category = null
    return out
  }
  if (model === 'booking' && name === 'passengers') {
    let rows = store.passenger.filter((p) => p.booking_id === row.id)
    rows = sortRows(rows, opts.orderBy)
    return rows.map((p) => applySelect(p, opts.select, opts.include, 'passenger'))
  }
  if (model === 'package' && (name === 'destination_rel' || name === 'category')) return null
  if (model === 'package' && name === 'bookings') {
    return store.booking.filter((b) => b.package_id === row.id)
  }
  return null
}

function sortRows(rows: Row[], orderBy?: Row | Row[]): Row[] {
  if (!orderBy) return rows
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy]
  return [...rows].sort((a, b) => {
    for (const clause of clauses) {
      const [field, dir] = Object.entries(clause)[0] as [string, string]
      const av = a[field]
      const bv = b[field]
      if (av === bv) continue
      const cmp = av > bv ? 1 : -1
      return dir === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

// ─────────────────────────── operações ───────────────────────────

function checkUnique(model: string, data: Row, ignoreId?: string) {
  for (const field of SPECS[model].unique) {
    const value = data[field]
    if (value === undefined || value === null) continue
    const clash = store[model].find((r) => r[field] === value && r.id !== ignoreId)
    if (clash) {
      throw new PrismaKnownError(
        'P2002',
        `Unique constraint failed on the fields: (\`${field}\`)`,
        { target: [field] },
      )
    }
  }
}

function checkForeign(model: string, data: Row) {
  const foreign = SPECS[model].foreign
  if (!foreign) return
  for (const [field, ref] of Object.entries(foreign)) {
    const value = data[field]
    if (value === undefined || value === null) continue
    const exists = store[ref.model].some((r) => r[ref.field] === value)
    if (!exists) {
      throw new PrismaKnownError(
        'P2003',
        `Foreign key constraint violated on the constraint: \`${model}_${field}_fkey\``,
        { field_name: `${model}_${field}_fkey` },
      )
    }
  }
}

function create(model: string, args: Row): Row {
  const { data } = args
  const nested: Row = {}
  const plain: Row = {}
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) && 'create' in (value as Row)) {
      nested[key] = value
    } else {
      plain[key] = value
    }
  }

  const now = new Date()
  const row: Row = {
    id: plain.id ?? cuid(SPECS[model].prefix),
    ...DEFAULTS[model],
    ...plain,
    created_at: plain.created_at ?? now,
    updated_at: plain.updated_at ?? now,
  }
  checkUnique(model, row)
  checkForeign(model, row)
  store[model].push(row)

  for (const [key, value] of Object.entries(nested)) {
    const childModel = key === 'passengers' ? 'passenger' : key
    const fk = model === 'booking' ? 'booking_id' : `${model}_id`
    const children = Array.isArray((value as Row).create) ? (value as Row).create : [(value as Row).create]
    for (const child of children) create(childModel, { data: { ...child, [fk]: row.id } })
  }

  return row
}

function makeModel(model: string) {
  const log = (op: string) => callLog.push({ model, op })
  return {
    findUnique: async (args: Row) => {
      log('findUnique')
      const row = store[model].find((r) => matchWhere(r, args.where))
      return row ? applySelect(row, args.select, args.include, model) : null
    },
    findFirst: async (args: Row = {}) => {
      log('findFirst')
      const rows = sortRows(store[model].filter((r) => matchWhere(r, args.where)), args.orderBy)
      return rows[0] ? applySelect(rows[0], args.select, args.include, model) : null
    },
    findMany: async (args: Row = {}) => {
      log('findMany')
      let rows = store[model].filter((r) => matchWhere(r, args.where))
      rows = sortRows(rows, args.orderBy)
      if (typeof args.skip === 'number') rows = rows.slice(args.skip)
      if (typeof args.take === 'number') rows = rows.slice(0, args.take)
      return rows.map((r) => applySelect(r, args.select, args.include, model))
    },
    count: async (args: Row = {}) => {
      log('count')
      return store[model].filter((r) => matchWhere(r, args.where)).length
    },
    create: async (args: Row) => {
      log('create')
      const row = create(model, args)
      return applySelect(row, args.select, args.include, model)
    },
    update: async (args: Row) => {
      log('update')
      const row = store[model].find((r) => matchWhere(r, args.where))
      if (!row) throw new PrismaKnownError('P2025', 'An operation failed because it depends on one or more records that were required but not found.')
      const next = { ...row }
      for (const [key, value] of Object.entries(args.data as Row)) {
        if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
          if ('increment' in (value as Row)) { next[key] = (next[key] || 0) + (value as Row).increment; continue }
          if ('decrement' in (value as Row)) { next[key] = (next[key] || 0) - (value as Row).decrement; continue }
          if ('set' in (value as Row)) { next[key] = (value as Row).set; continue }
        }
        next[key] = value
      }
      next.updated_at = new Date()
      checkUnique(model, next, row.id)
      checkForeign(model, next)
      Object.assign(row, next)
      return applySelect(row, args.select, args.include, model)
    },
    updateMany: async (args: Row) => {
      log('updateMany')
      const rows = store[model].filter((r) => matchWhere(r, args.where))
      for (const row of rows) Object.assign(row, args.data, { updated_at: new Date() })
      return { count: rows.length }
    },
    delete: async (args: Row) => {
      log('delete')
      const index = store[model].findIndex((r) => matchWhere(r, args.where))
      if (index === -1) throw new PrismaKnownError('P2025', 'Record to delete does not exist.')
      const [row] = store[model].splice(index, 1)
      // cascata simples
      if (model === 'affiliate') {
        store.affiliateReferral = store.affiliateReferral.filter((r) => r.affiliate_id !== row.id)
      }
      if (model === 'booking') {
        store.passenger = store.passenger.filter((p) => p.booking_id !== row.id)
      }
      return row
    },
    deleteMany: async (args: Row = {}) => {
      log('deleteMany')
      const keep = store[model].filter((r) => !matchWhere(r, args.where))
      const removed = store[model].length - keep.length
      store[model] = keep
      return { count: removed }
    },
  }
}

const prisma: any = {
  user: makeModel('user'),
  contact: makeModel('contact'),
  package: makeModel('package'),
  booking: makeModel('booking'),
  passenger: makeModel('passenger'),
  affiliate: makeModel('affiliate'),
  affiliateReferral: makeModel('affiliateReferral'),
  // Transação interativa roda sozinha: enquanto uma está aberta, as outras
  // esperam. É o que o Postgres garante com isolationLevel Serializable, e é
  // disso que a rota de reserva depende para não vender o mesmo assento duas
  // vezes.
  $transaction: async (arg: any, _options?: unknown) => {
    if (typeof arg !== 'function') return Promise.all(arg)
    const minhaVez = transactionQueue.then(() => arg(prisma))
    transactionQueue = minhaVez.then(
      () => undefined,
      () => undefined,
    )
    return minhaVez
  },
  $queryRaw: async () => [],
  $executeRaw: async () => 0,
  $disconnect: async () => {},
}

export default prisma
