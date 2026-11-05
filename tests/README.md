# Bateria de testes do programa de afiliados

```bash
npm run test:afiliados
```

124 testes. Roda em segundos, não precisa de servidor e **não encosta no banco**.

## Como funciona

Os testes chamam os handlers de verdade (`src/app/api/.../route.ts`), sem cópia
nem reimplementação. O que é trocado por dublê são só três módulos, via
`paths` do `tests/tsconfig.json`:

| módulo real            | dublê                 | por quê                                      |
| ---------------------- | --------------------- | -------------------------------------------- |
| `@/lib/prisma`         | `tests/mocks/prisma`  | banco em memória — produção fica intacta      |
| `@clerk/nextjs/server` | `tests/mocks/clerk`   | `setSession('user_x')` define quem está logado |
| `@/lib/email`          | `tests/mocks/email`   | nenhum email sai; os envios ficam registrados  |

O banco de mentira reproduz o que importa para estes testes: `where` com `in`,
`notIn` e `OR`, `select`/`include`, chaves únicas, chave estrangeira e
transação interativa serializada (uma de cada vez, como o Postgres em
`Serializable`).

## Suítes

| arquivo                        | cobre                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| `01-reserva-comissao.ts`       | venda com código, taxa do parceiro, preço calculado no servidor |
| `02-autorizacao.ts`            | cada rota como anônimo, cliente, afiliado e admin              |
| `03-fraude-afiliado.ts`        | auto-indicação, campos privilegiados, roubo de código          |
| `04-concorrencia.ts`           | dois cliques no mesmo assento, última vaga                     |
| `05-entrada-maliciosa.ts`      | SQL/XSS/unicode/payload gigante/tipo errado                    |
| `06-vazamento.ts`              | o que cada endpoint devolve para quem não deveria ver          |
| `07-contas.ts`                 | totais, faixas e o ciclo pendente → aprovada → paga            |
| `08-cadastro-ciclo.ts`         | cadastro, vinculação, aprovação, exclusão                      |
| `09-abuso-volume.ts`           | reserva-fantasma, rajada de requisições, enumeração de códigos |
| `10-aviso-whatsapp.ts`         | aprovação e avisos manuais: links wa.me e mensagens prontas    |
| `11-retencao.ts`               | comissão retida até a viagem, liberação, pagamento antecipado  |

## Escrevendo um teste novo

```ts
it('descreva o que NÃO pode acontecer', async () => {
  seedPackage()
  seedAffiliate({ code: 'MARIA01' })

  const res = await call(
    createBooking,
    jsonRequest('POST', '/api/bookings', bookingBody({ affiliateCode: 'MARIA01' })),
  )

  assertStatus(res, 201)
  assertEqual(table('affiliateReferral').length, 1)
})
```

`seed*` vem de `fixtures.ts`, `table('modelo')` lê o banco de mentira,
`setSession(clerkId)` loga alguém. Cada teste começa com o banco zerado.

## O que esta bateria não cobre

- Clerk de verdade (login, verificação de email, OAuth).
- Rate limit da borda da Cloudflare — em teste roda o limiter em memória, que
  é mais frouxo que o binding de produção (`wrangler.jsonc`).
- Telas: só as rotas de API são exercitadas.
