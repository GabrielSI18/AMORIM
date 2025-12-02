/**
 * Configuração de Add-ons
 * 
 * Add-ons hardcoded (features extras pagas)
 */

export type AddonId = 
  | 'ADDON_EXTRA_STORAGE_50GB'
  | 'ADDON_EXTRA_STORAGE_200GB'
  | 'ADDON_PRIORITY_SUPPORT'
  | 'ADDON_CUSTOM_DOMAIN'
  | 'ADDON_WHITE_LABEL';

export interface AddonConfig {
  id: AddonId;
  name: string;
  description: string;
  levelRequired: number; // Nível mínimo do plano para comprar
  benefits: string[];
}

/**
 * Configuração completa dos add-ons
 * 
 * IMPORTANTE: Os IDs devem corresponder aos registros na tabela `addons`
 * Os preços (stripe_price_id) ficam no DB para facilitar mudanças
 */
export const ADDONS: Record<AddonId, AddonConfig> = {
  ADDON_EXTRA_STORAGE_50GB: {
    id: 'ADDON_EXTRA_STORAGE_50GB',
    name: 'Armazenamento Extra 50GB',
    description: 'Adicione 50GB de armazenamento ao seu plano',
    levelRequired: 2, // Apenas Basic+
    benefits: [
      '+50GB de armazenamento',
      'Acesso vitalício',
      'Upload de arquivos maiores',
    ],
  },
  ADDON_EXTRA_STORAGE_200GB: {
    id: 'ADDON_EXTRA_STORAGE_200GB',
    name: 'Armazenamento Extra 200GB',
    description: 'Adicione 200GB de armazenamento ao seu plano',
    levelRequired: 2, // Apenas Basic+
    benefits: [
      '+200GB de armazenamento',
      'Acesso vitalício',
      'Upload de arquivos maiores',
      'Melhor custo-benefício',
    ],
  },
  ADDON_PRIORITY_SUPPORT: {
    id: 'ADDON_PRIORITY_SUPPORT',
    name: 'Suporte Prioritário (1 mês)',
    description: 'Suporte prioritário por 1 mês',
    levelRequired: 2, // Apenas Basic+
    benefits: [
      'Respostas em até 2 horas úteis',
      'Chat direto com time técnico',
      'Chamadas de emergência',
      'Válido por 30 dias',
    ],
  },
  ADDON_CUSTOM_DOMAIN: {
    id: 'ADDON_CUSTOM_DOMAIN',
    name: 'Domínio Customizado',
    description: 'Use seu próprio domínio (ex: app.seusite.com)',
    levelRequired: 3, // Apenas Pro+
    benefits: [
      'Domínio personalizado',
      'Certificado SSL incluso',
      'Setup guiado',
      'Acesso vitalício',
    ],
  },
  ADDON_WHITE_LABEL: {
    id: 'ADDON_WHITE_LABEL',
    name: 'White Label',
    description: 'Remova todas as marcas do produto',
    levelRequired: 4, // Apenas Enterprise
    benefits: [
      'Remoção completa de branding',
      'Logo customizado',
      'Emails personalizados',
      'Acesso vitalício',
    ],
  },
};

/**
 * Helper: Obter configuração de um add-on pelo ID
 */
export function getAddonConfig(addonId: AddonId): AddonConfig {
  return ADDONS[addonId];
}

/**
 * Helper: Obter add-ons disponíveis para um nível de plano
 */
export function getAvailableAddons(planLevel: number): AddonConfig[] {
  return Object.values(ADDONS).filter(
    (addon) => addon.levelRequired <= planLevel
  );
}

/**
 * Helper: Verificar se usuário pode comprar add-on
 */
export function canPurchaseAddon(planLevel: number, addonId: AddonId): boolean {
  const addon = getAddonConfig(addonId);
  return planLevel >= addon.levelRequired;
}

/**
 * Helper: Obter todos os add-ons
 */
export function getAllAddons(): AddonConfig[] {
  return Object.values(ADDONS);
}
