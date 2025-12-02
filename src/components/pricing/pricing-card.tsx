'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import type { PlanFeature } from '@/lib/plans';

interface PricingCardProps {
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    priceId: string;
  } | null;
  features: PlanFeature[];
  popular?: boolean;
  isFree?: boolean;
  onSubscribe: (priceId: string) => void;
  isLoading?: boolean;
}

export function PricingCard({
  name,
  description,
  price,
  features,
  popular = false,
  isFree = false,
  onSubscribe,
  isLoading = false,
}: PricingCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const intervalText = price?.interval === 'year' ? '/ano' : '/mês';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative flex flex-col p-8 rounded-2xl border-2 transition-all hover:shadow-xl ${
        popular
          ? 'border-primary bg-primary/5 shadow-lg scale-105'
          : 'border-border bg-card hover:border-primary/50'
      }`}
    >
      {/* Badge "Mais Popular" */}
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
          Mais Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Preço */}
      <div className="mb-8">
        {isFree ? (
          <div className="text-4xl font-bold">Grátis</div>
        ) : price ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{formatPrice(price.amount)}</span>
              <span className="text-muted-foreground">{intervalText}</span>
            </div>
            {price.interval === 'year' && (
              <p className="text-sm text-primary mt-2">
                💰 Economize 2 meses pagando anualmente
              </p>
            )}
          </>
        ) : (
          <div className="text-2xl font-bold text-muted-foreground">
            Sob consulta
          </div>
        )}
      </div>

      {/* Botão CTA */}
      <Button
        onClick={() => price && onSubscribe(price.priceId)}
        disabled={isLoading || !price}
        className={`w-full mb-8 ${popular ? 'bg-primary' : ''}`}
        size="lg"
      >
        {isLoading ? 'Carregando...' : isFree ? 'Começar Grátis' : 'Assinar Agora'}
      </Button>

      {/* Features */}
      <div className="space-y-3 flex-1">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          O que está incluído:
        </p>
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}>
              {feature.name}
              {feature.limit && feature.included && (
                <span className="text-primary ml-2 font-medium">
                  ({feature.limit})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
