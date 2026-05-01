# TODO — Amorim Turismo

> Plano de execução com 16 tasks em 4 sprints (P0→P3)
> Decisões: SiteConfig no banco via painel admin, fretamento com formulário + WhatsApp, passageiros com nome/CPF/nascimento/telefone obrigatórios

---

## 🚀 Infra — Fazer ANTES de tudo (Deploy + Produção)

### [x] Task INFRA-1: Subir projeto e domínio na Vercel ✅
**Prioridade:** CRÍTICO | **Estimativa:** M | **Concluída em:** 2026-03-25

**Resultado:**
- Deploy via Vercel CLI (`npx vercel --prod --yes`) — sem Git integration (conta GitHub diferente)
- Domínio `amorimturismo.com.br` aliased na Vercel
- `vercel.json` com `prisma generate && next build`
- Env vars configuradas no dashboard da Vercel
- HTTPS funcionando

---

### [x] Task INFRA-2: Passar Clerk de Development para Produção ✅
**Prioridade:** CRÍTICO | **Estimativa:** M | **Concluída em:** 2026-03-25

**Resultado:**
- Clerk em modo produção com chaves `pk_live_` e `sk_live_`
- DNS CNAME `clerk.amorimturismo.com.br` configurado
- Login e cadastro funcionando em produção
- Corrigido conflito unique constraint (email) na transição dev→prod
- Webhook Clerk configurado para produção

---

## Sprint 1 — P0 (Urgente)

### [x] Task 0: Criar modelo SiteConfig (fundação) ✅
**Prioridade:** P0 | **Estimativa:** G | **Concluída em:** 2026-03-25

**Resultado:**
- Modelo `SiteConfig` singleton no Prisma (id='default')
- Tabela criada via `db push` e seeded com dados reais da Amorim
- API Route `/api/site-config` (GET público, PUT admin com `requireAdmin()`)
- Helper `getSiteConfig()` em `src/lib/site-config.ts` com `unstable_cache` (5min + tag)
- Hook `useSiteConfig()` em `src/hooks/use-site-config.ts` com cache em memória
- Substituídos ~12 arquivos: footer, public-layout, contato, faq, afiliados, reserva, confirmação
- seo.tsx corrigido (era template "Exaltius"/"base2025")
- Falta: página admin `dashboard/configuracoes` para edição visual

---

### [x] Task 1: WhatsApp centralizado via SiteConfig ✅
**Prioridade:** P0 | **Estimativa:** M | **Concluída em:** 2026-03-25

**Resultado:**
- Todos os links WhatsApp/tel/mailto agora consomem do SiteConfig
- Hook `useSiteConfig()` com fallback embutido (nunca quebra)
- Arquivos atualizados: reserva, confirmação, contato, faq, afiliados, public-layout, footer
- error.tsx mantido estático (error boundary não deve fazer API calls)
- Número centralizado: (31) 98886-2079 / 5531988862079

---

### [x] Task 2: Cadastro completo de passageiros na reserva ✅
**Prioridade:** P0 | **Estimativa:** G | **Concluída em:** 2026-04-30

**Resultado:**
- Modelo `Passenger` no Prisma com FK para `Booking` (cascade delete) — campos obrigatórios `full_name`, `cpf`, `birth_date`, `phone` + opcionais `sex`, `rg`, `emergency_contact_*`, `is_responsible`, `seat_number`
- Tabela criada via `db push` (mesmo padrão do Task 0)
- `passengerSchema` + `passengersSchema` em `src/lib/validations.ts` com `cpfSchema`/`phoneSchema`/`birthDateSchema` reutilizáveis
- API `src/app/api/bookings/route.ts` POST valida array, exige `length === numPassengers` e cria passageiros aninhados via Prisma; GET inclui `passengers` ordenados por criação
- Página `src/app/reserva/[packageId]/page.tsx`: nova seção "Cadastro dos Passageiros" com N cards sincronizados a `numPassengers`, botão "Usar dados do responsável" no Passageiro 1, badges de Responsável + Assento, validação client-side antes do submit
- Admin (`src/app/dashboard/reservas/page.tsx`): cards de cada passageiro no modal + botão de export CSV individual e botão "Exportar Passageiros" na header (UTF-8 com BOM, escape adequado)

---

### [x] Task 3: Corrigir sidebar da reserva ✅
**Prioridade:** P0 | **Estimativa:** P | **Concluída em:** 2026-04-30

**Resultado:**
- Sidebar (`lg:block`) em `src/app/reserva/[packageId]/page.tsx` agora tem `sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1` — rola internamente quando conteúdo passa da viewport e mantém posição "encaixada" abaixo do header sticky (top-0 ~4rem)
- Mobile (`lg:hidden`) preservado: botão inline no fim do form, sem overlap
- Type-check passou (0 erros)

---

### [ ] Task 4: Corrigir layout do ônibus
**Prioridade:** P0 | **Estimativa:** G

**O que fazer:**
1. Em `src/components/packages/bus-seat-map.tsx`:
   - Ajustar numeração/disposição para bater com ônibus real
   - Suportar variações (ex: última fileira com 5 assentos)
2. Se `floors > 1`, renderizar ambos os andares (tabs ou scroll)
3. Garantir mesma renderização em: reserva (interativo), admin (view), pacote (display)
4. Legenda: motorista, porta, corredor, ocupado, disponível, selecionado
5. Validar bloqueio de assentos ocupados via API

**Aceite:**
- Layout visual = ônibus real
- 2 andares funcionam
- Seleção respeita ocupados/bloqueados

---

## Sprint 2 — P1 (Alta)

### [⏸] Task 5: Home focada em Fretamento — EM STAND BY
**Prioridade:** P1 | **Estimativa:** G | **Status:** aguardando decisão

**Decisão pendente (2026-04-30):**
O foco do site é venda de pacotes, não fretamento. Fretamento é uma realidade da empresa mas papel secundário — `/fretamento` (Task 7) + entrada no `/contato` já cobrem quem quer fretar. A reescrita completa da home pra fretamento não faz mais sentido.

**Possíveis caminhos quando reabrir:**
- **A. Cancelar a task** — home atual já vende pacotes; canal de fretamento existe via `/fretamento` e `/contato`.
- **B. Versão reduzida (P/M)** — manter home focada em pacotes e adicionar 1 banner/card discreto para `/fretamento` no final + link no footer/menu. Mantém visibilidade sem mover o foco.

**Escopo original (caso seja decidido executar como estava):**
1. Reescrever `src/app/page.tsx`:
   - Hero: "Fretamento de Ônibus para Viagens, Eventos e Empresas" + CTA duplo (formulário + WhatsApp)
   - Cards de fretamento: tipos (excursões, corporativo, casamentos, religiosos)
   - Seção Frota: preview com fotos, capacidade → link `/frota`
   - Pacotes em Destaque: manter
   - Depoimentos/confiança: nova seção
   - Contato: consumir do SiteConfig
2. Manter bottom navigation e GlobalSearch

---

### [x] Task 6: Remover placa e ano da frota (UI pública) ✅
**Prioridade:** P1 | **Estimativa:** P | **Concluída em:** 2026-04-30

**Resultado:**
- API `/api/fleet` (GET) e `/api/fleet/[busId]` (GET) agora detectam admin via Clerk + role no banco. Para não-admin, aplicam `select` que omite `plate` e `year` (`publicBusSelect`)
- API `/api/packages/[packageId]/seats` (público) — `bus.select` agora não inclui `plate` nem `year`
- Interfaces `BusInfo` (em `src/components/packages/bus-seat-map.tsx`) e `BusData` (em `src/app/frota/page.tsx`) marcam `plate?` e `year?` como opcionais para refletir o payload público
- Admin continua recebendo todos os campos: `dashboard/frota/*` e `dashboard/pacotes/*` exibem placa/ano normalmente (auth com cookie do Clerk faz isAdmin=true na API)
- Verificado que UI pública (`/frota`, `/reserva`, modais de fotos, etc) já não renderizava nem placa nem ano — agora também não recebe via JSON

---

### [x] Task 7: Contato — formulário de Fretamento ✅
**Prioridade:** P1 | **Estimativa:** G | **Concluída em:** 2026-04-30

**Resultado:**
- Modelo `Contact` no Prisma com novo campo `type` (default `general`) + colunas opcionais para charter: `origin`, `destination`, `departure_date`, `return_date`, `passengers_count`, `event_type`. Aplicado via `db push`. Index em `type`.
- API `/api/contacts` com `discriminatedUnion` (zod) por `type`: charter exige origem, destino, data de ida e quantidade de passageiros. Charter é salvo com `priority = 'high'` por default. GET aceita filtro `?type=charter|general` e busca também em origin/destination.
- Página pública `src/app/fretamento/page.tsx`: hero com CTAs (WhatsApp + form), grid de tipos de fretamento (corporativo/casamento/religioso/formatura/escolar/excursões), formulário completo com validação client-side + botão alternativo "Enviar pelo WhatsApp" que abre `wa.me` com mensagem pré-formatada (origem, destino, datas, passageiros, tipo de evento, observações).
- `src/app/contato/page.tsx`: "Fretamento de ônibus" adicionado aos assuntos. Quando selecionado, mostra banner sugerindo o formulário dedicado em `/fretamento`.
- `src/app/dashboard/contatos/page.tsx`: novo filtro de tipo (Todos/Geral/Fretamento), badge "Fretamento" com ícone nos cards, linha resumo com origem→destino + datas + passageiros, e seção dedicada "Detalhes do Fretamento" no modal com todos os campos extras.

---

### [ ] Task 8: Pixel Meta + Redes Sociais
**Prioridade:** P1 | **Estimativa:** M

**O que fazer:**
1. Campos já no SiteConfig (Task 0): `meta_pixel_id`, `instagram_url`, `facebook_url`
2. Criar `src/components/layout/meta-pixel.tsx` (script via `next/script`)
3. Integrar em `src/app/layout.tsx`
4. Atualizar footer.tsx: trocar links genéricos (`facebook.com`, `instagram.com`) pelos valores do SiteConfig
5. Adicionar ícones de redes na home também

**Aceite:**
- Pixel carrega em todas as páginas públicas (se configurado)
- Links de redes apontam para perfis reais da Amorim

---

## Sprint 3 — P2 (Média)

### [x] Task 9: Clientes — botão "Novo Cliente" + Importar CSV (Task 11) ✅
**Prioridade:** P2 | **Estimativa:** M | **Concluída em:** 2026-04-30
**Nota:** Task 11 (importar CSV) executada no mesmo bloco — o cliente Amorim controla viagens em caderno hoje e precisa migrar a base existente.

**Resultado:**
- Modelo `User` no Prisma estendido: `clerk_id String?` (nulo p/ cadastros manuais), novos campos `phone`, `cpf @unique`, `notes @db.Text`, `source` (clerk/manual/import) com index. Aplicado via `db push --accept-data-loss` (cpf coluna nova, sem conflitos).
- `src/app/api/clients/route.ts` (POST): criação manual com `requireAdmin`, validação Zod (cpfOpcional/email/phone), dedup por email/cpf — existente é atualizado, novo é criado com `source: 'manual'`.
- `src/app/api/clients/import/route.ts` (POST): importação em massa via array de objetos (até 5000 linhas). Valida linha-a-linha, dedup por email/cpf, retorna `{summary: {total, created, updated, skipped}, errors: [{row, email, message}]}`. Linhas inválidas não bloqueiam o lote.
- `src/app/dashboard/clientes/clientes-actions.tsx` (Client Component): botões "Novo Cliente" e "Importar CSV" expostos via `PageHeader.action`. Modal de criação com nome/email/telefone/CPF/notas e máscaras. Modal de importação com instruções, link de download de template CSV, parser CSV inline (suporta `,` `;` `\t`, aspas escapadas, BOM UTF-8), preview das primeiras 10 linhas, mapeamento tolerante de cabeçalho (name/nome, email/e-mail, phone/telefone/celular, cpf, notes/observações), e relatório final com contadores + lista de erros.
- Após sucesso, `router.refresh()` re-executa o Server Component da listagem.

---

### [ ] Task 10: Clientes — corrigir busca + UX
**Prioridade:** P2 | **Estimativa:** M

**O que fazer:**
1. Converter lista para client component (ou extrair)
2. API `/api/clients?search=TERMO` buscando por nome, email, telefone, CPF
3. Paginação (offset/limit) na API e frontend
4. Highlight do termo buscado
5. Ordenação por nome, data, qtd bookings

**Aceite:**
- Busca funciona por nome/telefone/CPF/email
- Paginação e ordenação funcional
- Responsivo no mobile

---

### [x] Task 11: Clientes — importar CSV ✅ (executada com Task 9)
**Prioridade:** P2 | **Estimativa:** G | **Concluída em:** 2026-04-30

**Resultado:**
- Implementação consolidada com a Task 9 — ver detalhes lá.
- Suporte a CSV (parser inline, sem dep adicional). XLSX **não** foi implementado (fora do escopo do que o cliente precisa hoje).
- Validação por linha (nome, email, CPF opcional com 11 dígitos), dedup por email/CPF, atualização de existentes, relatório de erros, template para download.
- Caso XLSX seja necessário no futuro, adicionar `sheetjs` e converter a planilha para o mesmo array que a importação CSV consome.

---

### [ ] Task 12: Afiliado — ampliar cadastro
**Prioridade:** P2 | **Estimativa:** M

**O que fazer:**
1. Adicionar campos em `src/app/afiliados/page.tsx`:
   - `cpf_cnpj`, `pix_key` (já existe), `bank_name`, `bank_account` (já existe)
   - `city`, `state`, `instagram_handle`
2. Atualizar modelo `Affiliate` no Prisma se faltar campo
3. Validação Zod para CPF/CNPJ
4. Atualizar API de criação

**Aceite:**
- Form valida campos obrigatórios
- Admin vê tudo no detalhe

---

### [x] Task 13: Corrigir tela de detalhes do afiliado ✅
**Prioridade:** P2 | **Estimativa:** M | **Concluída em:** 2026-04-30

**Resultado:**
- Layout da `src/app/dashboard/afiliados/[id]/page.tsx` corrigido: removido `container-custom` (que limitava largura), agora usa `px-4 sm:px-6 py-6 space-y-6` consistente com as outras telas do dashboard.
- Header com `flex-wrap` + `truncate` para acomodar nomes longos.
- Detalhes completos já existentes: dados pessoais, código, link copiável, chave PIX, stats (comissão, reservas, vendas, ganhos), histórico de referrals com ações (aprovar/pagar/copiar). Ações de status (aprovar/rejeitar/suspender/reativar) integradas com `PATCH /api/affiliates/[id]` que agora dispara email automaticamente quando vira `active`.

---

### [x] Task 14: Tracking do link de afiliado + sistema 100% funcional ✅
**Prioridade:** P2 | **Estimativa:** P (consolidada em escopo maior) | **Concluída em:** 2026-04-30

**Resultado:**
- **Tracking universal:** novo `<AffiliateTracker />` (Client Component com Suspense boundary) no root layout chama `useAffiliateTracking` em todas as páginas. Antes só rodava em `/pacotes` — agora `?ref=CODIGO` funciona em qualquer URL pública (home, pacote individual, frota, etc). Cookie + localStorage por 30 dias (já existiam).
- **Reserva:** `/api/bookings` POST já lia `affiliateCode`, validava `status='active'` e criava `AffiliateReferral`. Agora também dispara email `sendAffiliateNewSaleEmail` para o afiliado fire-and-forget.
- **Aprovação:** `PATCH /api/affiliates` e `PATCH /api/affiliates/[id]` detectam transição `pending→active` (busca status anterior antes do update) e disparam `sendAffiliateApprovedEmail` com código + link + comissão.
- **Pagamento de comissão:** `PUT /api/affiliates/referrals` quando vira `paid` dispara `sendAffiliateCommissionPaidEmail` com valor formatado em BRL e data.
- **3 templates novos** em `src/lib/email-templates.tsx` (AffiliateApprovedEmail, AffiliateNewSaleEmail, AffiliateCommissionPaidEmail) com branding Amorim (azul `#003c71`, logo) e CTAs para `/dashboard/parceiro`.
- **3 helpers novos** em `src/lib/email.ts` (sendAffiliateApprovedEmail, sendAffiliateNewSaleEmail, sendAffiliateCommissionPaidEmail).
- **Painel do parceiro** (`/dashboard/parceiro`): já tinha código copiável, link geral copiável e **link individual por pacote** com cálculo de comissão visível.
- **APP_NAME / EMAIL_FROM defaults** corrigidos: deixaram de apontar para "Base2025" e agora apontam para "Amorim Turismo" / `noreply@amorimturismo.com.br`.

**Como ativar emails em produção:**
- Setar `ACTIVE_EMAIL=true`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EMAIL_FROM` no Vercel env. Sem isso, helpers retornam `success: false` mas não bloqueiam fluxo.

---

## Sprint 4 — P3 (Estratégico)

### [ ] Task 15: Cálculo automático de lucro por viagem
**Prioridade:** P3 | **Estimativa:** G

**O que fazer:**
1. Criar modelo `Expense` no Prisma:
   - `id`, `package_id` (FK), `category` (enum: combustível, motorista, pedágio, hospedagem, alimentação, comissão, taxa, outro)
   - `description`, `amount`, `date`, `created_by`
2. Criar migration
3. Page admin `src/app/dashboard/pacotes/[id]/financeiro/page.tsx`:
   - **Receita:** soma bookings pagos
   - **Despesas:** tabela editável por categoria
   - **Resultado:** lucro líquido, margem %, ponto de equilíbrio
4. API Routes CRUD de expenses
5. Card "Lucro estimado" na view do pacote (admin)
6. Relatório consolidado `src/app/dashboard/relatorios/financeiro/page.tsx`
7. Exportar relatório CSV/PDF

**Aceite:**
- Admin preenche despesas → vê lucro automático
- Relatório por viagem exportável

---

## Legenda

- **P** = Pequena (< 2h)
- **M** = Média (2-6h)
- **G** = Grande (6h+)
- **[ ]** = Não iniciado
- **[~]** = Em progresso
- **[⏸]** = Em stand by (aguardando decisão de escopo)
- **[x]** = Concluído
