'use client'

import { Shield, AlertCircle, Clock, CreditCard, XCircle, CheckCircle } from 'lucide-react'
import { PublicLayout } from '@/components/layout'

export default function PoliticasPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#004a80] to-[#003a66] py-16">
        <div className="container-custom text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Políticas de Cancelamento
          </h1>
          <p className="text-xl text-white/80">
            Transparência e segurança em todas as etapas da sua viagem
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container-custom max-w-4xl space-y-8">
          
          {/* Visão Geral */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-2">Visão Geral</h2>
                <p className="text-[#6c757d] dark:text-[#adb5bd] leading-relaxed">
                  Entendemos que imprevistos acontecem. Por isso, oferecemos políticas de 
                  cancelamento justas e transparentes. Leia atentamente as condições abaixo 
                  antes de efetuar sua reserva.
                </p>
              </div>
            </div>
          </div>

          {/* Prazos de Cancelamento */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa]">Prazos e Reembolsos</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#212529] dark:text-[#f8f9fa] mb-1">
                    Mais de 30 dias antes da viagem
                  </h3>
                  <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                    Reembolso integral de 100% do valor pago, sem multas ou taxas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#212529] dark:text-[#f8f9fa] mb-1">
                    Entre 15 e 30 dias antes da viagem
                  </h3>
                  <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                    Reembolso de 70% do valor pago. Retenção de 30% para cobrir custos 
                    administrativos e reservas já confirmadas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#212529] dark:text-[#f8f9fa] mb-1">
                    Entre 7 e 14 dias antes da viagem
                  </h3>
                  <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                    Reembolso de 50% do valor pago. Retenção de 50% devido à proximidade 
                    da data e compromissos já assumidos com fornecedores.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#212529] dark:text-[#f8f9fa] mb-1">
                    Menos de 7 dias antes da viagem
                  </h3>
                  <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                    Não há reembolso disponível. O valor pode ser convertido em crédito 
                    para uso em futuras viagens, válido por 12 meses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Como Solicitar */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa]">Como Solicitar Cancelamento</h2>
            </div>
            
            <ol className="space-y-4 text-[#6c757d] dark:text-[#adb5bd]">
              <li className="flex gap-4">
                <span className="w-8 h-8 bg-[#d32f2f] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </span>
                <div>
                  <h4 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-1">Entre em contato</h4>
                  <p className="text-sm">
                    Envie um e-mail para contato@amorimturismo.com.br ou entre em contato 
                    pelo WhatsApp (31) 99973-2079 informando seu desejo de cancelar.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="w-8 h-8 bg-[#d32f2f] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </span>
                <div>
                  <h4 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-1">Forneça os dados</h4>
                  <p className="text-sm">
                    Informe o número da reserva, nome completo do titular e motivo do 
                    cancelamento (opcional, mas ajuda a melhorarmos nossos serviços).
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="w-8 h-8 bg-[#d32f2f] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </span>
                <div>
                  <h4 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-1">Aguarde a confirmação</h4>
                  <p className="text-sm">
                    Nossa equipe analisará sua solicitação e enviará um e-mail de confirmação 
                    em até 2 dias úteis com os detalhes do reembolso.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="w-8 h-8 bg-[#d32f2f] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </span>
                <div>
                  <h4 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-1">Receba o reembolso</h4>
                  <p className="text-sm">
                    O reembolso será processado em até 15 dias úteis após a aprovação, 
                    utilizando o mesmo método de pagamento da compra original.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Casos Especiais */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-4">Casos Especiais</h2>
            
            <div className="space-y-4 text-[#6c757d] dark:text-[#adb5bd]">
              <div>
                <h3 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-2">Cancelamento por parte da Amorim Turismo</h3>
                <p className="text-sm">
                  Caso a empresa cancele a viagem por qualquer motivo (força maior, falta 
                  de quórum mínimo, etc.), o cliente terá direito a reembolso integral 
                  ou crédito de 110% do valor para uso em outra viagem.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-2">Remarcação de Data</h3>
                <p className="text-sm">
                  É possível remarcar a viagem para outra data disponível sem custos adicionais, 
                  desde que solicitado com pelo menos 15 dias de antecedência. Sujeito à 
                  disponibilidade e possível diferença de tarifa.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-2">Transferência de Titularidade</h3>
                <p className="text-sm">
                  É permitido transferir a reserva para outra pessoa mediante taxa 
                  administrativa de R$ 100,00 por passageiro, desde que solicitado 
                  com pelo menos 7 dias de antecedência.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-[#212529] dark:text-[#f8f9fa] mb-2">Seguro Viagem</h3>
                <p className="text-sm">
                  Recomendamos fortemente a contratação de seguro viagem, que pode cobrir 
                  cancelamentos por motivos médicos e outros imprevistos não contemplados 
                  em nossa política padrão.
                </p>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-[#d32f2f]/10 border border-[#d32f2f]/30 rounded-xl p-6">
            <p className="text-[#212529] dark:text-[#f8f9fa] text-sm">
              <strong>Importante:</strong> Estas políticas são válidas para reservas realizadas 
              diretamente com a Amorim Turismo. Reservas feitas através de terceiros podem 
              estar sujeitas a políticas diferentes. Em caso de dúvidas, entre em contato 
              antes de efetuar sua reserva.
            </p>
          </div>

          {/* Última atualização */}
          <p className="text-center text-[#6c757d] dark:text-[#adb5bd] text-sm">
            Última atualização: Dezembro de 2025
          </p>
        </div>
      </section>
    </PublicLayout>
  )
}
