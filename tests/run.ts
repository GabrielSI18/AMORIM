import { run, beforeEach } from './harness'
import { resetDb } from './mocks/prisma'
import { resetEmails } from './mocks/email'
import { setSession } from './mocks/clerk'

import { register as s01 } from './suites/01-reserva-comissao'
import { register as s02 } from './suites/02-autorizacao'
import { register as s03 } from './suites/03-fraude-afiliado'
import { register as s04 } from './suites/04-concorrencia'
import { register as s05 } from './suites/05-entrada-maliciosa'
import { register as s06 } from './suites/06-vazamento'
import { register as s07 } from './suites/07-contas'
import { register as s08 } from './suites/08-cadastro-ciclo'
import { register as s09 } from './suites/09-abuso-volume'
import { register as s10 } from './suites/10-aviso-whatsapp'
import { register as s11 } from './suites/11-retencao'
import { register as s12 } from './suites/12-lead-anuncio'

beforeEach(() => {
  resetDb()
  resetEmails()
  setSession(null)
})

s01(); s02(); s03(); s04(); s05(); s06(); s07(); s08(); s09(); s10(); s11(); s12()

run().then(({ passed, failed }) => {
  console.log(`\n${'='.repeat(64)}`)
  console.log(`PASS: ${passed}   FAIL: ${failed.length}`)
  if (failed.length) {
    console.log('\nFalhas:')
    for (const f of failed) console.log(`  - [${f.suite}] ${f.name}\n      ${f.message.split('\n')[0]}`)
  }
  process.exit(0)
})
