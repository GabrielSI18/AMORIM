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

### [ ] Task 2: Cadastro completo de passageiros na reserva
**Prioridade:** P0 | **Estimativa:** G

**O que fazer:**
1. Criar modelo `Passenger` no Prisma:
   - `id`, `booking_id` (FK), `full_name` (obrig), `cpf` (obrig), `birth_date` (obrig)
   - `phone` (obrig), `sex` (opcional), `rg` (opcional)
   - `emergency_contact_name` (opcional), `emergency_contact_phone` (opcional)
   - `is_responsible` (boolean), `seat_number` (opcional)
2. Criar migration
3. Refatorar `src/app/reserva/[packageId]/page.tsx`: N formulários (um por passageiro)
4. Adicionar validação Zod em `src/lib/validations.ts` (`passengerSchema`)
5. Atualizar API `src/app/api/bookings/route.ts` para receber array de passageiros
6. Atualizar admin — visualização de booking mostra lista de passageiros
7. Botão "Exportar Passageiros" (CSV) na view admin

**Aceite:**
- Não finaliza reserva sem todos os passageiros preenchidos (nome, CPF, nascimento, telefone)
- Admin vê/exporta lista completa

---

### [ ] Task 3: Corrigir sidebar da reserva
**Prioridade:** P0 | **Estimativa:** P

**O que fazer:**
1. Em `src/app/reserva/[packageId]/page.tsx`, ajustar sidebar:
   - `sticky top-24` + `max-h-[calc(100vh-8rem)] overflow-y-auto`
2. Testar em viewport pequeno (768px height) e grande
3. Garantir que mobile continua com botão fixo no bottom

**Aceite:**
- Sidebar não desencaixa, não sobrepõe conteúdo
- Rola internamente se conteúdo maior que viewport

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

### [ ] Task 5: Home focada em Fretamento
**Prioridade:** P1 | **Estimativa:** G

**O que fazer:**
1. Reescrever `src/app/page.tsx`:
   - **Hero:** "Fretamento de Ônibus para Viagens, Eventos e Empresas" + CTA duplo (formulário + WhatsApp)
   - **Cards de fretamento:** tipos (excursões, corporativo, casamentos, religiosos)
   - **Seção Frota:** preview com fotos, capacidade → link `/frota`
   - **Pacotes em Destaque:** manter
   - **Depoimentos/confiança:** nova seção
   - **Contato:** consumir do SiteConfig
2. Manter bottom navigation e GlobalSearch

**Aceite:**
- CTA principal leva para formulário de fretamento ou WhatsApp
- Frota visível acima da dobra no mobile

---

### [ ] Task 6: Remover placa e ano da frota (UI pública)
**Prioridade:** P1 | **Estimativa:** P

**O que fazer:**
1. Confirmar que `plate` e `year` não aparecem em nenhuma tela pública (ano já removido)
2. Verificar modal de fotos, detalhes, etc
3. Manter plate/year visíveis no admin
4. Ajustar API `/api/fleet` para não enviar plate/year ao frontend público (select)

**Aceite:**
- Nenhuma tela pública mostra placa ou ano
- Admin continua vendo/editando

---

### [ ] Task 7: Contato — formulário de Fretamento
**Prioridade:** P1 | **Estimativa:** G

**O que fazer:**
1. Criar página `src/app/fretamento/page.tsx`:
   - Campos: origem, destino, data ida, data volta (opc), qtd passageiros, tipo evento, observações, nome, telefone, email
2. Adicionar "Fretamento de ônibus" nos assuntos do `src/app/contato/page.tsx`
3. Atualizar modelo `Contact` no Prisma: campo `type` (general/charter)
4. CTA WhatsApp como alternativa (mensagem pré-formatada)
5. No admin, filtrar contatos por tag "Fretamento"

**Aceite:**
- Formulário salva no banco, admin vê com tag "Fretamento"
- WhatsApp abre com dados preenchidos

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

### [ ] Task 9: Clientes — botão "Novo Cliente"
**Prioridade:** P2 | **Estimativa:** M

**O que fazer:**
1. Botão "Novo Cliente" em `src/app/dashboard/clientes/page.tsx`
2. Modal ou page `src/app/dashboard/clientes/novo/page.tsx` (nome, email, telefone, CPF, notas)
3. API Route `src/app/api/clients/route.ts` (POST)
4. Reaproveitar modelo `User` com `source: manual`

**Aceite:**
- Criação manual funciona e aparece na listagem

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

### [ ] Task 11: Clientes — importar CSV/XLSX
**Prioridade:** P2 | **Estimativa:** G

**O que fazer:**
1. Botão "Importar" ao lado de "Novo Cliente"
2. Upload + parser CSV (`papaparse`) e XLSX (`sheetjs`)
3. Preview com mapeamento de colunas
4. Validação: CPF, telefone, email. Erros por linha
5. Dedup por CPF (existir → atualizar; não → criar)
6. Template CSV para download

**Aceite:**
- Importa clientes com relatório de erros
- Template disponível para download

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

### [ ] Task 13: Corrigir tela de detalhes do afiliado
**Prioridade:** P2 | **Estimativa:** M

**O que fazer:**
1. Criar view de detalhe (modal ou page `/afiliados/[id]`) no dashboard
2. Mostrar: dados completos, link de afiliado, stats, histórico de referrals
3. Ações: editar, ativar/desativar/suspender, copiar link, marcar comissões pagas

**Aceite:**
- Detalhe mostra informações completas com ações

---

### [ ] Task 14: Verificar tracking do link de afiliado
**Prioridade:** P2 | **Estimativa:** P

**O que fazer:**
1. Revisar `src/hooks/use-affiliate-tracking.ts` (cookie + localStorage)
2. Verificar se reserva envia `affiliateCode` no booking
3. Verificar se API cria `AffiliateReferral` corretamente
4. Testar fluxo: link → navegar → reservar → referral no admin
5. Corrigir gaps

**Aceite:**
- Link do afiliado → reserva → referral vinculado corretamente

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
- **[x]** = Concluído
