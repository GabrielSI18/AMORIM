'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Upload, X, Loader2, Download, FileSpreadsheet, AlertCircle } from 'lucide-react'

export const CLIENTES_REFRESH_EVENT = 'clientes:refresh'

function notifyRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CLIENTES_REFRESH_EVENT))
  }
}

interface CsvRow {
  name: string
  email: string
  phone?: string
  cpf?: string
  notes?: string
}

const HEADER_ALIASES: Record<keyof CsvRow, string[]> = {
  name: ['name', 'nome', 'cliente', 'razao social', 'razão social'],
  email: ['email', 'e-mail', 'mail'],
  phone: ['phone', 'telefone', 'celular', 'fone', 'whatsapp'],
  cpf: ['cpf', 'documento'],
  notes: ['notes', 'notas', 'observacao', 'observação', 'observacoes', 'observações', 'obs'],
}

function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function detectSeparator(line: string): string {
  const counts = {
    ',': (line.match(/,/g) || []).length,
    ';': (line.match(/;/g) || []).length,
    '\t': (line.match(/\t/g) || []).length,
  }
  if (counts[';'] > counts[',']) return ';'
  if (counts['\t'] > counts[',']) return '\t'
  return ','
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === sep) {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCsv(text: string): CsvRow[] {
  const cleaned = text.replace(/\r\n?/g, '\n').replace(/^﻿/, '')
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []

  const sep = detectSeparator(lines[0])
  const headers = splitCsvLine(lines[0], sep).map(normalizeHeader)

  const colIndex: Partial<Record<keyof CsvRow, number>> = {}
  for (const key of Object.keys(HEADER_ALIASES) as (keyof CsvRow)[]) {
    const idx = headers.findIndex((h) => HEADER_ALIASES[key].includes(h))
    if (idx !== -1) colIndex[key] = idx
  }

  if (colIndex.name === undefined || colIndex.email === undefined) {
    throw new Error(
      'CSV precisa ter as colunas "name" (ou "nome") e "email". Verifique o cabeçalho.',
    )
  }

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep)
    const row: CsvRow = {
      name: cols[colIndex.name!] || '',
      email: cols[colIndex.email!] || '',
    }
    if (colIndex.phone !== undefined) row.phone = cols[colIndex.phone] || ''
    if (colIndex.cpf !== undefined) row.cpf = cols[colIndex.cpf] || ''
    if (colIndex.notes !== undefined) row.notes = cols[colIndex.notes] || ''
    rows.push(row)
  }
  return rows
}

const TEMPLATE_CSV = `name,email,phone,cpf,notes
João da Silva,joao@exemplo.com,31988887777,12345678901,Cliente fidelizado desde 2020
Maria Santos,maria@exemplo.com,31999998888,,Prefere assento na janela
`

function downloadTemplate() {
  const blob = new Blob(['﻿' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-clientes.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ClientesActions() {
  const [showNew, setShowNew] = useState(false)
  const [showImport, setShowImport] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] text-gray-900 dark:text-[#E0E0E0] rounded-lg hover:border-primary transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Importar CSV
        </button>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {showNew && (
        <NovoClienteModal
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            setShowNew(false)
            notifyRefresh()
          }}
        />
      )}

      {showImport && (
        <ImportarClientesModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false)
            notifyRefresh()
          }}
        />
      )}
    </>
  )
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function NovoClienteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[NovoClienteModal] handleSubmit', { name: form.name, email: form.email })

    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, '') || undefined,
        cpf: form.cpf.replace(/\D/g, '') || undefined,
        notes: form.notes.trim() || undefined,
      }
      console.log('[NovoClienteModal] POST /api/clients', payload)
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log('[NovoClienteModal] response status', res.status)
      const data = await res.json().catch((parseErr) => {
        console.error('[NovoClienteModal] parse error', parseErr)
        return { error: 'Resposta inválida do servidor' }
      })
      console.log('[NovoClienteModal] response body', data)

      if (!res.ok) {
        toast.error(data.error || `Erro ${res.status} ao criar cliente`)
        return
      }
      toast.success(data.updated ? 'Cliente atualizado com sucesso' : 'Cliente criado com sucesso')
      onSuccess()
    } catch (err) {
      console.error('[NovoClienteModal] fetch error', err)
      toast.error(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao criar cliente')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Novo Cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <Field label="Nome completo *">
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: João da Silva"
            className={inputClass}
          />
        </Field>
        <Field label="E-mail *">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="cliente@exemplo.com"
            className={inputClass}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
              placeholder="(31) 99999-9999"
              className={inputClass}
            />
          </Field>
          <Field label="CPF">
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: formatCpf(e.target.value) })}
              placeholder="000.000.000-00"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Notas internas">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Histórico, preferências, observações..."
            className={`${inputClass} resize-none`}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Cadastrar
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface ImportSummary {
  total: number
  created: number
  updated: number
  skipped: number
}

interface ImportError {
  row: number
  email?: string
  message: string
}

function ImportarClientesModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ summary: ImportSummary; errors: ImportError[] } | null>(null)

  const handleFile = async (file: File) => {
    setParseError(null)
    setRows([])
    setResult(null)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (parsed.length === 0) {
        setParseError('Arquivo CSV vazio ou sem linhas de dados')
        return
      }
      setRows(parsed)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Falha ao ler CSV')
    }
  }

  const handleSubmit = async () => {
    if (rows.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao importar')
        return
      }
      setResult(data)
      const s = data.summary as ImportSummary
      toast.success(`Importação concluída: ${s.created} criados, ${s.updated} atualizados, ${s.skipped} ignorados`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao importar')
    } finally {
      setSubmitting(false)
    }
  }

  const previewRows = useMemo(() => rows.slice(0, 10), [rows])

  return (
    <Modal title="Importar Clientes (CSV)" onClose={onClose}>
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Pré upload / instruções */}
        {rows.length === 0 && !result && (
          <>
            <div className="rounded-lg border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#2A2A2A] p-4 text-sm text-gray-700 dark:text-[#E0E0E0]">
              <p className="font-medium mb-2">Formato esperado:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-[#A0A0A0]">
                <li>Arquivo .csv (UTF-8) com cabeçalho</li>
                <li>Colunas obrigatórias: <code>name</code> (ou <code>nome</code>) e <code>email</code></li>
                <li>Colunas opcionais: <code>phone</code>, <code>cpf</code>, <code>notes</code></li>
                <li>Separador: vírgula, ponto-e-vírgula ou tab (detectado automaticamente)</li>
                <li>Existentes (mesmo email/cpf) são atualizados; novos são criados</li>
              </ul>
              <button
                type="button"
                onClick={downloadTemplate}
                className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="w-4 h-4" />
                Baixar template CSV
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-[#444] rounded-lg p-8 hover:border-primary transition-colors flex flex-col items-center gap-2 text-gray-600 dark:text-[#A0A0A0]"
            >
              <FileSpreadsheet className="w-10 h-10" />
              <p className="font-medium">Clique para selecionar o arquivo CSV</p>
              <p className="text-xs">Limite: 5000 linhas por importação</p>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />

            {parseError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-500 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{parseError}</p>
              </div>
            )}
          </>
        )}

        {/* Preview do CSV antes de importar */}
        {rows.length > 0 && !result && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-700 dark:text-[#E0E0E0]">
                <strong>{rows.length}</strong> linha(s) detectada(s). Pré-visualização das primeiras 10:
              </p>
              <button
                type="button"
                onClick={() => {
                  setRows([])
                  setParseError(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="text-sm text-primary hover:underline"
              >
                Trocar arquivo
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-[#333] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#2A2A2A]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#E0E0E0]">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#E0E0E0]">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#E0E0E0]">E-mail</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#E0E0E0]">Telefone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-[#E0E0E0]">CPF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                  {previewRows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-500 dark:text-[#A0A0A0]">{idx + 1}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-[#E0E0E0]">{r.name}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-[#E0E0E0]">{r.email}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-[#E0E0E0]">{r.phone || '—'}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-[#E0E0E0]">{r.cpf || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Importar {rows.length} cliente(s)
              </button>
            </div>
          </>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard label="Total" value={result.summary.total} color="text-gray-700 dark:text-[#E0E0E0]" />
              <SummaryCard label="Criados" value={result.summary.created} color="text-green-500" />
              <SummaryCard label="Atualizados" value={result.summary.updated} color="text-blue-500" />
              <SummaryCard label="Ignorados" value={result.summary.skipped} color="text-orange-500" />
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-sm font-medium text-red-500 mb-2">
                  {result.errors.length} linha(s) com erro:
                </p>
                <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <li key={idx} className="text-red-500">
                      Linha {err.row}{err.email ? ` (${err.email})` : ''}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onSuccess}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

const inputClass =
  'w-full px-4 py-2 bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#444] rounded-lg text-gray-900 dark:text-[#E0E0E0] placeholder-gray-400 dark:placeholder-[#666] focus:outline-none focus:border-primary transition'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-[#A0A0A0] mb-1">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E0E0E0]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#2A2A2A] p-3">
      <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
