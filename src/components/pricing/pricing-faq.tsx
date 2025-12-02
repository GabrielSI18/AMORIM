'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer:
      'Sim! Você pode cancelar sua assinatura a qualquer momento. O cancelamento entra em vigor no final do período de faturamento atual, e você continuará tendo acesso até lá.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer:
      'Aceitamos cartões de crédito (Visa, Mastercard, American Express), cartões de débito, PIX e boleto bancário. Todos os pagamentos são processados de forma segura pelo Stripe.',
  },
  {
    question: 'Posso mudar de plano depois?',
    answer:
      'Claro! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Se fizer upgrade, a diferença será cobrada proporcionalmente. Se fizer downgrade, o crédito será aplicado no próximo ciclo.',
  },
  {
    question: 'O que acontece se eu exceder os limites do meu plano?',
    answer:
      'Você receberá uma notificação quando estiver próximo do limite. Se exceder, algumas funcionalidades podem ser temporariamente limitadas até o próximo ciclo ou até fazer upgrade.',
  },
  {
    question: 'Existe um período de teste gratuito?',
    answer:
      'O plano Gratuito permite que você teste as funcionalidades básicas sem limite de tempo. Para planos pagos, oferecemos garantia de 14 dias - se não gostar, devolvemos seu dinheiro.',
  },
  {
    question: 'Como funciona o desconto anual?',
    answer:
      'Ao escolher o plano anual, você economiza o equivalente a 2 meses de assinatura. O pagamento é feito de uma vez, e você tem acesso por 12 meses completos.',
  },
  {
    question: 'Preciso de cartão de crédito para o plano gratuito?',
    answer:
      'Não! O plano gratuito não requer cartão de crédito. Você pode usar todas as funcionalidades básicas sem nenhum compromisso financeiro.',
  },
  {
    question: 'Como posso obter suporte?',
    answer:
      'Todos os planos incluem suporte por email. Planos Pro e Enterprise têm acesso a suporte prioritário com tempo de resposta mais rápido. Enterprise também inclui suporte 24/7.',
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="w-full max-w-3xl mx-auto mt-20"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Perguntas frequentes
        </h2>
        <p className="text-muted-foreground">
          Tire suas dúvidas sobre nossos planos e pagamentos
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 text-muted-foreground">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
