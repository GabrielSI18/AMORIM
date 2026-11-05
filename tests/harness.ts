/**
 * Runner mínimo + utilidades para chamar as rotas reais do Next.
 */

import { NextRequest } from 'next/server'

// ─────────────────────────── runner ───────────────────────────

interface TestCase {
  suite: string
  name: string
  fn: () => Promise<void> | void
}

const cases: TestCase[] = []
let currentSuite = 'geral'
let beforeEachFn: (() => Promise<void> | void) | null = null

export function describe(name: string, fn: () => void) {
  const previous = currentSuite
  currentSuite = name
  fn()
  currentSuite = previous
}

export function it(name: string, fn: () => Promise<void> | void) {
  cases.push({ suite: currentSuite, name, fn })
}

export function beforeEach(fn: () => Promise<void> | void) {
  beforeEachFn = fn
}

export interface Failure {
  suite: string
  name: string
  message: string
}

export async function run(): Promise<{ passed: number; failed: Failure[] }> {
  const failed: Failure[] = []
  let passed = 0
  let suite = ''

  for (const test of cases) {
    if (test.suite !== suite) {
      suite = test.suite
      console.log(`\n  ${suite}`)
    }
    try {
      if (beforeEachFn) await beforeEachFn()
      await test.fn()
      passed++
      console.log(`    PASS  ${test.name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failed.push({ suite: test.suite, name: test.name, message })
      console.log(`    FAIL  ${test.name}`)
      console.log(`          ${message.split('\n').join('\n          ')}`)
    }
  }

  return { passed, failed }
}

// ─────────────────────────── asserts ───────────────────────────

export function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

export function assertEqual(actual: unknown, expected: unknown, message?: string) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    throw new Error(`${message ? message + '\n' : ''}esperado: ${e}\nrecebido: ${a}`)
  }
}

export function assertStatus(response: { status: number }, expected: number, context = '') {
  if (response.status !== expected) {
    throw new Error(`${context} esperava HTTP ${expected}, veio ${response.status}`)
  }
}

export async function assertRejects(fn: () => Promise<unknown>, message: string) {
  try {
    await fn()
  } catch {
    return
  }
  throw new Error(message)
}

// ─────────────────────────── requests ───────────────────────────

const BASE = 'https://amorimturismo.com.br'

export function jsonRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(path, BASE), {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  } as any)
}

export function getRequest(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL(path, BASE), { method: 'GET', headers } as any)
}

export async function readJson(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { __raw: text }
  }
}

/** Chama um handler e devolve status + corpo já parseado */
export async function call(
  handler: (req: any, ctx?: any) => Promise<Response>,
  request: unknown,
  ctx?: unknown,
): Promise<{ status: number; body: any }> {
  const response = await handler(request as any, ctx as any)
  return { status: response.status, body: await readJson(response) }
}
