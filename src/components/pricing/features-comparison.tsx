'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { PLANS, PlanId } from '@/lib/plans';

/**
 * Tabela comparativa de features entre planos
 */
export function FeaturesComparison() {
  const planIds: PlanId[] = ['PLAN_FREE', 'PLAN_BASIC', 'PLAN_PRO', 'PLAN_ENTERPRISE'];
  
  // Extrair todas as features únicas
  const allFeatures = Array.from(
    new Set(
      Object.values(PLANS).flatMap((plan) => plan.features.map((f) => f.name))
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="w-full max-w-6xl mx-auto mt-20"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Compare todos os recursos
        </h2>
        <p className="text-muted-foreground">
          Veja exatamente o que cada plano oferece
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 font-semibold">Recurso</th>
              {planIds.map((planId) => (
                <th key={planId} className="text-center py-4 px-4 font-semibold">
                  <span className={PLANS[planId].popular ? 'text-primary' : ''}>
                    {PLANS[planId].name}
                  </span>
                  {PLANS[planId].popular && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((featureName, idx) => (
              <tr
                key={featureName}
                className={`border-b border-border/50 ${
                  idx % 2 === 0 ? 'bg-muted/20' : ''
                }`}
              >
                <td className="py-4 px-4 text-sm">{featureName}</td>
                {planIds.map((planId) => {
                  const feature = PLANS[planId].features.find(
                    (f) => f.name === featureName
                  );
                  const included = feature?.included ?? false;
                  const limit = feature?.limit;

                  return (
                    <td key={planId} className="text-center py-4 px-4">
                      {included ? (
                        <div className="flex items-center justify-center gap-1">
                          <Check className="w-5 h-5 text-green-500" />
                          {limit && (
                            <span className="text-xs text-muted-foreground">
                              {limit}
                            </span>
                          )}
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-6">
        {planIds.map((planId) => (
          <div
            key={planId}
            className={`p-6 rounded-xl border ${
              PLANS[planId].popular
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <h3 className="font-bold text-lg mb-4">
              {PLANS[planId].name}
              {PLANS[planId].popular && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
            </h3>
            <ul className="space-y-2">
              {PLANS[planId].features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={!feature.included ? 'text-muted-foreground' : ''}>
                    {feature.name}
                    {feature.limit && feature.included && (
                      <span className="text-muted-foreground ml-1">
                        ({feature.limit})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
