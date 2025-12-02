#!/bin/bash

# =============================================================================
# Script: Criar Produtos e Preços no Stripe
# 
# Este script cria os produtos e preços no Stripe e atualiza o banco de dados.
# Usa a STRIPE_SECRET_KEY do .env.local
# =============================================================================

set -e

echo "🚀 Criando produtos e preços no Stripe..."
echo ""

# Carregar STRIPE_SECRET_KEY do .env.local
if [ -f .env.local ]; then
  export $(grep -E "^STRIPE_SECRET_KEY=" .env.local | xargs)
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY não encontrada no .env.local"
    exit 1
fi

echo "✅ Usando chave: ${STRIPE_SECRET_KEY:0:20}..."
echo ""

# Verificar se stripe está instalada
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI não encontrada. Instale com: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo "❌ jq não encontrado. Instale com: brew install jq"
    exit 1
fi

# =============================================================================
# CRIAR PRODUTOS
# =============================================================================

echo "📦 Criando produtos..."

# Produto Basic
PROD_BASIC=$(stripe products create \
  --api-key="$STRIPE_SECRET_KEY" \
  --name="Plano Básico" \
  --description="Para indivíduos e pequenos times" \
  -d "metadata[plan_id]=PLAN_BASIC" | jq -r '.id')
echo "  ✅ Produto Basic: $PROD_BASIC"

# Produto Pro
PROD_PRO=$(stripe products create \
  --api-key="$STRIPE_SECRET_KEY" \
  --name="Plano Pro" \
  --description="Para profissionais e times em crescimento" \
  -d "metadata[plan_id]=PLAN_PRO" | jq -r '.id')
echo "  ✅ Produto Pro: $PROD_PRO"

# Produto Enterprise
PROD_ENTERPRISE=$(stripe products create \
  --api-key="$STRIPE_SECRET_KEY" \
  --name="Plano Enterprise" \
  --description="Para grandes empresas com necessidades customizadas" \
  -d "metadata[plan_id]=PLAN_ENTERPRISE" | jq -r '.id')
echo "  ✅ Produto Enterprise: $PROD_ENTERPRISE"

echo ""

# =============================================================================
# CRIAR PREÇOS
# =============================================================================

echo "💰 Criando preços..."

# BASIC - Mensal (R$ 29,00)
PRICE_BASIC_MONTH=$(stripe prices create \
  --api-key="$STRIPE_SECRET_KEY" \
  --product="$PROD_BASIC" \
  --unit-amount=2900 \
  --currency=brl \
  -d "recurring[interval]=month" \
  -d "metadata[plan_id]=PLAN_BASIC" \
  -d "metadata[interval]=month" | jq -r '.id')
echo "  ✅ Basic Mensal (R\$29): $PRICE_BASIC_MONTH"

# BASIC - Anual (R$ 290,00 = 10 meses)
PRICE_BASIC_YEAR=$(stripe prices create \
  --api-key="$STRIPE_SECRET_KEY" \
  --product="$PROD_BASIC" \
  --unit-amount=29000 \
  --currency=brl \
  -d "recurring[interval]=year" \
  -d "metadata[plan_id]=PLAN_BASIC" \
  -d "metadata[interval]=year" | jq -r '.id')
echo "  ✅ Basic Anual (R\$290): $PRICE_BASIC_YEAR"

# PRO - Mensal (R$ 79,00)
PRICE_PRO_MONTH=$(stripe prices create \
  --api-key="$STRIPE_SECRET_KEY" \
  --product="$PROD_PRO" \
  --unit-amount=7900 \
  --currency=brl \
  -d "recurring[interval]=month" \
  -d "metadata[plan_id]=PLAN_PRO" \
  -d "metadata[interval]=month" | jq -r '.id')
echo "  ✅ Pro Mensal (R\$79): $PRICE_PRO_MONTH"

# PRO - Anual (R$ 790,00 = 10 meses)
PRICE_PRO_YEAR=$(stripe prices create \
  --api-key="$STRIPE_SECRET_KEY" \
  --product="$PROD_PRO" \
  --unit-amount=79000 \
  --currency=brl \
  -d "recurring[interval]=year" \
  -d "metadata[plan_id]=PLAN_PRO" \
  -d "metadata[interval]=year" | jq -r '.id')
echo "  ✅ Pro Anual (R\$790): $PRICE_PRO_YEAR"

# ENTERPRISE - Mensal (R$ 199,00)
PRICE_ENTERPRISE_MONTH=$(stripe prices create \
  --api-key="$STRIPE_SECRET_KEY" \
  --product="$PROD_ENTERPRISE" \
  --unit-amount=19900 \
  --currency=brl \
  -d "recurring[interval]=month" \
  -d "metadata[plan_id]=PLAN_ENTERPRISE" \
  -d "metadata[interval]=month" | jq -r '.id')
echo "  ✅ Enterprise Mensal (R\$199): $PRICE_ENTERPRISE_MONTH"

# ENTERPRISE - Anual (R$ 1990,00 = 10 meses)
PRICE_ENTERPRISE_YEAR=$(stripe prices create \
  --api-key="$STRIPE_SECRET_KEY" \
  --product="$PROD_ENTERPRISE" \
  --unit-amount=199000 \
  --currency=brl \
  -d "recurring[interval]=year" \
  -d "metadata[plan_id]=PLAN_ENTERPRISE" \
  -d "metadata[interval]=year" | jq -r '.id')
echo "  ✅ Enterprise Anual (R\$1990): $PRICE_ENTERPRISE_YEAR"

echo ""

# =============================================================================
# GERAR SQL PARA ATUALIZAR BANCO
# =============================================================================

echo "📝 Gerando SQL para atualizar o banco..."

SQL_FILE="prisma/update-stripe-prices.sql"

cat > "$SQL_FILE" << EOF
-- Atualizar preços com IDs reais do Stripe
-- Gerado automaticamente em $(date)

-- BASIC
UPDATE prices SET stripe_price_id = '$PRICE_BASIC_MONTH', stripe_product_id = '$PROD_BASIC' WHERE plan_id = 'PLAN_BASIC' AND interval = 'month';
UPDATE prices SET stripe_price_id = '$PRICE_BASIC_YEAR', stripe_product_id = '$PROD_BASIC' WHERE plan_id = 'PLAN_BASIC' AND interval = 'year';

-- PRO  
UPDATE prices SET stripe_price_id = '$PRICE_PRO_MONTH', stripe_product_id = '$PROD_PRO' WHERE plan_id = 'PLAN_PRO' AND interval = 'month';
UPDATE prices SET stripe_price_id = '$PRICE_PRO_YEAR', stripe_product_id = '$PROD_PRO' WHERE plan_id = 'PLAN_PRO' AND interval = 'year';

-- ENTERPRISE
UPDATE prices SET stripe_price_id = '$PRICE_ENTERPRISE_MONTH', stripe_product_id = '$PROD_ENTERPRISE' WHERE plan_id = 'PLAN_ENTERPRISE' AND interval = 'month';
UPDATE prices SET stripe_price_id = '$PRICE_ENTERPRISE_YEAR', stripe_product_id = '$PROD_ENTERPRISE' WHERE plan_id = 'PLAN_ENTERPRISE' AND interval = 'year';
EOF

echo "  ✅ SQL salvo em: $SQL_FILE"

echo ""
echo "=========================================="
echo "🎉 RESUMO - IDs CRIADOS"
echo "=========================================="
echo ""
echo "PRODUTOS:"
echo "  PLAN_BASIC:      $PROD_BASIC"
echo "  PLAN_PRO:        $PROD_PRO"
echo "  PLAN_ENTERPRISE: $PROD_ENTERPRISE"
echo ""
echo "PREÇOS:"
echo "  Basic Mensal:      $PRICE_BASIC_MONTH"
echo "  Basic Anual:       $PRICE_BASIC_YEAR"
echo "  Pro Mensal:        $PRICE_PRO_MONTH"
echo "  Pro Anual:         $PRICE_PRO_YEAR"
echo "  Enterprise Mensal: $PRICE_ENTERPRISE_MONTH"
echo "  Enterprise Anual:  $PRICE_ENTERPRISE_YEAR"
echo ""
echo "=========================================="
echo ""
echo "📌 PRÓXIMOS PASSOS:"
echo ""
echo "1. Execute o SQL no banco:"
echo "   npx prisma db execute --file prisma/update-stripe-prices.sql"
echo ""
echo "2. Ou atualize manualmente via Supabase Dashboard"
echo ""
