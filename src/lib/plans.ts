/**
 * Configuração de Plans e Features
 * 
 * Features hardcoded por plan (não precisa de tabela no DB)
 * Facilita manutenção e deploy de novos planos
 */

export type PlanId = 'PLAN_FREE' | 'PLAN_BASIC' | 'PLAN_PRO' | 'PLAN_ENTERPRISE';

export type PlanInterval = 'month' | 'year' | 'quarter';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number | string; // Ex: 10, "10GB", "Unlimited"
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  level: number;
  features: PlanFeature[];
  popular?: boolean; // Badge "Mais Popular"
}

/**
 * Configuração completa dos planos
 * 
 * IMPORTANTE: Os IDs devem corresponder aos registros na tabela `plans`
 */
export const PLANS: Record<PlanId, PlanConfig> = {
  PLAN_FREE: {
    id: 'PLAN_FREE',
    name: 'Gratuito',
    description: 'Para começar e testar o produto',
    level: 1,
    features: [
      { name: 'Até 3 projetos', included: true, limit: 3 },
      { name: 'Armazenamento básico', included: true, limit: '1GB' },
      { name: 'Suporte por email', included: true },
      { name: 'Exportação de dados', included: false },
      { name: 'API Access', included: false },
      { name: 'Suporte prioritário', included: false },
    ],
  },
  PLAN_BASIC: {
    id: 'PLAN_BASIC',
    name: 'Básico',
    description: 'Para indivíduos e pequenos times',
    level: 2,
    features: [
      { name: 'Até 10 projetos', included: true, limit: 10 },
      { name: 'Armazenamento', included: true, limit: '10GB' },
      { name: 'Suporte por email', included: true },
      { name: 'Exportação de dados', included: true },
      { name: 'API Access', included: false },
      { name: 'Suporte prioritário', included: false },
    ],
  },
  PLAN_PRO: {
    id: 'PLAN_PRO',
    name: 'Pro',
    description: 'Para profissionais e times em crescimento',
    level: 3,
    popular: true,
    features: [
      { name: 'Projetos ilimitados', included: true, limit: 'Unlimited' },
      { name: 'Armazenamento', included: true, limit: '100GB' },
      { name: 'Suporte prioritário', included: true },
      { name: 'Exportação de dados', included: true },
      { name: 'API Access', included: true },
      { name: 'Webhooks', included: true },
    ],
  },
  PLAN_ENTERPRISE: {
    id: 'PLAN_ENTERPRISE',
    name: 'Enterprise',
    description: 'Para grandes empresas com necessidades customizadas',
    level: 4,
    features: [
      { name: 'Projetos ilimitados', included: true, limit: 'Unlimited' },
      { name: 'Armazenamento ilimitado', included: true, limit: 'Unlimited' },
      { name: 'Suporte prioritário 24/7', included: true },
      { name: 'Exportação de dados', included: true },
      { name: 'API Access', included: true },
      { name: 'Webhooks', included: true },
      { name: 'SLA garantido', included: true },
      { name: 'Onboarding dedicado', included: true },
      { name: 'Custom integrações', included: true },
    ],
  },
};

/**
 * Helper: Obter configuração de um plan pelo ID
 */
export function getPlanConfig(planId: PlanId): PlanConfig {
  return PLANS[planId];
}

/**
 * Helper: Verificar se um plan tem uma feature específica
 */
export function hasPlanFeature(planId: PlanId, featureName: string): boolean {
  const plan = getPlanConfig(planId);
  const feature = plan.features.find((f) => f.name === featureName);
  return feature?.included ?? false;
}

/**
 * Helper: Obter o limite de uma feature
 */
export function getPlanFeatureLimit(planId: PlanId, featureName: string): number | string | undefined {
  const plan = getPlanConfig(planId);
  const feature = plan.features.find((f) => f.name === featureName);
  return feature?.limit;
}

/**
 * Helper: Verificar se é upgrade ou downgrade
 */
export function isUpgrade(fromPlanId: PlanId, toPlanId: PlanId): boolean {
  return PLANS[toPlanId].level > PLANS[fromPlanId].level;
}

export function isDowngrade(fromPlanId: PlanId, toPlanId: PlanId): boolean {
  return PLANS[toPlanId].level < PLANS[fromPlanId].level;
}

/**
 * Helper: Obter todos os plans ordenados por level
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLANS).sort((a, b) => a.level - b.level);
}

/**
 * Helper: Obter apenas plans públicos (não privados)
 */
export function getPublicPlans(): PlanConfig[] {
  return getAllPlans(); // Por enquanto todos são públicos
}
