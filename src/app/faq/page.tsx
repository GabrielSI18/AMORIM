'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, Search } from 'lucide-react'
import { PublicLayout } from '@/components/layout'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    category: 'Reservas',
    questions: [
      {
        question: 'Como faço para reservar um pacote de viagem?',
        answer: 'Para reservar um pacote, basta acessar nossa página de pacotes, escolher o destino desejado e clicar em "Reservar". Você será guiado pelo processo de pagamento seguro. Após a confirmação, você receberá um e-mail com todos os detalhes da sua viagem.',
      },
      {
        question: 'Posso reservar para um grupo?',
        answer: 'Sim! Oferecemos condições especiais para grupos a partir de 10 pessoas. Entre em contato conosco pelo WhatsApp ou e-mail para receber uma proposta personalizada com descontos exclusivos.',
      },
      {
        question: 'Com quanto tempo de antecedência devo reservar?',
        answer: 'Recomendamos reservar com pelo menos 30 dias de antecedência para garantir disponibilidade, especialmente em alta temporada. Algumas promoções podem ter vagas limitadas e esgotar rapidamente.',
      },
    ],
  },
  {
    category: 'Pagamento',
    questions: [
      {
        question: 'Quais formas de pagamento são aceitas?',
        answer: 'Aceitamos cartões de crédito (Visa, Mastercard, Elo, American Express), PIX, boleto bancário e parcelamento em até 12x sem juros no cartão. Para grupos, também oferecemos condições especiais de pagamento.',
      },
      {
        question: 'Posso parcelar minha viagem?',
        answer: 'Sim! Oferecemos parcelamento em até 12x sem juros no cartão de crédito. O número de parcelas disponíveis pode variar de acordo com o valor total do pacote e a bandeira do cartão.',
      },
      {
        question: 'Quando serei cobrado?',
        answer: 'O pagamento é processado no momento da reserva. Para cartão de crédito, a primeira parcela é cobrada imediatamente. Para PIX e boleto, a reserva é confirmada após a compensação do pagamento.',
      },
    ],
  },
  {
    category: 'Cancelamento e Reembolso',
    questions: [
      {
        question: 'Posso cancelar minha reserva?',
        answer: 'Sim, você pode cancelar sua reserva. As condições de cancelamento variam de acordo com a antecedência: até 30 dias antes, reembolso integral; entre 15 e 30 dias, reembolso de 70%; menos de 15 dias, reembolso de 50%. Consulte nossa página de Políticas de Cancelamento para mais detalhes.',
      },
      {
        question: 'Como solicito reembolso?',
        answer: 'Para solicitar reembolso, entre em contato com nosso suporte através do e-mail ou pelo WhatsApp. O reembolso é processado em até 15 dias úteis após a aprovação, no mesmo método de pagamento utilizado na compra.',
      },
      {
        question: 'E se a viagem for cancelada pela empresa?',
        answer: 'Caso a Amorim Turismo cancele a viagem por qualquer motivo, você terá direito a reembolso integral ou poderá optar por crédito para uma viagem futura com bônus de 10% sobre o valor pago.',
      },
    ],
  },
  {
    category: 'Documentação',
    questions: [
      {
        question: 'Quais documentos preciso para viajar?',
        answer: 'Para viagens nacionais, é necessário documento de identidade (RG) ou CNH em bom estado. Para viagens internacionais, é necessário passaporte válido (com pelo menos 6 meses de validade). Alguns países exigem visto, que deve ser providenciado com antecedência.',
      },
      {
        question: 'Menores podem viajar sozinhos?',
        answer: 'Menores de 16 anos não podem viajar desacompanhados em nossos pacotes. Entre 16 e 18 anos, é necessário autorização judicial ou dos pais com firma reconhecida. Consulte-nos para mais informações sobre a documentação necessária.',
      },
    ],
  },
  {
    category: 'Programa de Afiliados',
    questions: [
      {
        question: 'Como me tornar um afiliado?',
        answer: 'Para se tornar um afiliado, acesse nossa página de Afiliados e preencha o formulário de cadastro. Após aprovação, você receberá um link exclusivo para divulgar nossos pacotes e ganhar comissões por cada venda realizada.',
      },
      {
        question: 'Qual a comissão para afiliados?',
        answer: 'Nossos afiliados recebem comissões de 5% a 15% sobre o valor de cada venda, dependendo do volume de vendas mensal. Quanto mais você vende, maior sua porcentagem de comissão.',
      },
    ],
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0)

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#004a80] to-[#003a66] py-16">
        <div className="container-custom text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Encontre respostas para as dúvidas mais comuns
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6c757d]" />
            <input
              type="text"
              placeholder="Buscar pergunta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-[#212529] dark:text-[#f8f9fa] placeholder-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#004a80] transition"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12">
        <div className="container-custom max-w-4xl">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6c757d] dark:text-[#adb5bd]">Nenhuma pergunta encontrada para &ldquo;{searchTerm}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredFaqs.map((category) => (
                <div key={category.category}>
                  <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-4 px-1">
                    {category.category}
                  </h2>
                  <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-200 dark:divide-gray-700 shadow-sm">
                    {category.questions.map((item, index) => {
                      const itemId = `${category.category}-${index}`
                      const isOpen = openItems.includes(itemId)
                      
                      return (
                        <div key={index}>
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition"
                          >
                            <span className="text-[#212529] dark:text-[#f8f9fa] font-medium pr-4">
                              {item.question}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <ChevronDown className="w-5 h-5 text-[#6c757d] flex-shrink-0" />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4">
                                  <p className="text-[#6c757d] dark:text-[#adb5bd] leading-relaxed">
                                    {item.answer}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-4">
            Não encontrou sua resposta?
          </h2>
          <p className="text-[#6c757d] dark:text-[#adb5bd] mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:amorimturismo@ymai.com"
              className="px-6 py-3 bg-[#004a80] text-white rounded-lg font-medium hover:bg-[#003a66] transition"
            >
              Enviar Email
            </a>
            <a
              href="https://wa.me/5531999732079"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white dark:bg-[#1e1e1e] text-[#212529] dark:text-[#f8f9fa] border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
