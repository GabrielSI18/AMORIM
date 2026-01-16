'use client'

import { FileText, BookOpen, Users, ShieldCheck, AlertTriangle, Scale } from 'lucide-react'
import { PublicLayout } from '@/components/layout'

export default function TermosPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#004a80] to-[#003a66] py-16">
        <div className="container-custom text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Termos de Uso
          </h1>
          <p className="text-xl text-white/80">
            Leia atentamente os termos e condições de uso dos nossos serviços
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container-custom max-w-4xl space-y-8">
          
          {/* 1. Aceitação dos Termos */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">1. Aceitação dos Termos</h2>
                <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
                  <p>
                    Ao acessar e utilizar o site da Amorim Turismo (www.amorimturismo.com.br), 
                    você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você 
                    não concordar com qualquer parte destes termos, não deverá utilizar nossos 
                    serviços.
                  </p>
                  <p>
                    A Amorim Turismo reserva-se o direito de modificar estes termos a qualquer 
                    momento, sendo as alterações publicadas nesta página. O uso continuado do 
                    site após as alterações constitui aceitação dos novos termos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Serviços Oferecidos */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">2. Serviços Oferecidos</h2>
                <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
                  <p>
                    A Amorim Turismo atua como intermediária entre o cliente e os prestadores 
                    de serviços turísticos (hotéis, companhias aéreas, locadoras de veículos, 
                    etc.), oferecendo:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Pacotes de viagem completos (nacionais e internacionais)</li>
                    <li>Reservas de hospedagem</li>
                    <li>Passagens aéreas, terrestres e marítimas</li>
                    <li>Locação de veículos</li>
                    <li>Seguros de viagem</li>
                    <li>Passeios e excursões</li>
                    <li>Assessoria e consultoria de viagem</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Cadastro e Conta */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">3. Cadastro e Conta</h2>
                <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
                  <p>
                    Para utilizar determinados serviços, você deverá criar uma conta 
                    fornecendo informações verdadeiras, completas e atualizadas. Você é 
                    responsável por:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Manter a confidencialidade de sua senha</li>
                    <li>Todas as atividades realizadas em sua conta</li>
                    <li>Notificar imediatamente sobre uso não autorizado</li>
                    <li>Garantir que suas informações estejam sempre atualizadas</li>
                  </ul>
                  <p>
                    A Amorim Turismo não se responsabiliza por perdas decorrentes de 
                    uso não autorizado de sua conta, quando o vazamento de credenciais 
                    não for de responsabilidade da empresa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Reservas e Pagamentos */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">4. Reservas e Pagamentos</h2>
                <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">4.1 Confirmação:</strong> A reserva 
                    só será considerada confirmada após a aprovação do pagamento e envio 
                    do e-mail de confirmação pela Amorim Turismo.
                  </p>
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">4.2 Preços:</strong> Os preços 
                    exibidos estão sujeitos a alterações sem aviso prévio até o momento 
                    da confirmação da reserva. Após a confirmação, o preço é garantido.
                  </p>
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">4.3 Pagamento:</strong> Aceitamos 
                    cartões de crédito, PIX e boleto bancário. Parcelamento em até 12x 
                    sem juros no cartão, sujeito à análise de crédito.
                  </p>
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">4.4 Documentação:</strong> É de 
                    responsabilidade do cliente verificar a documentação necessária para 
                    a viagem (passaporte, vistos, vacinas) antes de efetuar a reserva.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Responsabilidades */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#d32f2f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">5. Limitação de Responsabilidade</h2>
                <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">5.1</strong> A Amorim Turismo atua 
                    como intermediária e não se responsabiliza por atos de terceiros 
                    (companhias aéreas, hotéis, etc.), incluindo cancelamentos, atrasos 
                    ou alterações de serviços.
                  </p>
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">5.2</strong> Não nos responsabilizamos 
                    por eventos de força maior (desastres naturais, pandemias, greves, 
                    conflitos, etc.) que possam afetar a viagem.
                  </p>
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">5.3</strong> O cliente é responsável 
                    por seus pertences pessoais durante toda a viagem.
                  </p>
                  <p>
                    <strong className="text-[#212529] dark:text-[#f8f9fa]">5.4</strong> Recomendamos fortemente 
                    a contratação de seguro viagem para todas as viagens.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Propriedade Intelectual */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">6. Propriedade Intelectual</h2>
            <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
              <p>
                Todo o conteúdo do site (textos, imagens, logos, design, código) é 
                propriedade da Amorim Turismo ou de seus parceiros, protegido por 
                leis de direitos autorais. É proibido:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Reproduzir, copiar ou distribuir o conteúdo sem autorização</li>
                <li>Usar a marca Amorim Turismo sem consentimento expresso</li>
                <li>Fazer engenharia reversa do site ou sistemas</li>
                <li>Utilizar robôs ou scrapers para coletar dados</li>
              </ul>
            </div>
          </div>

          {/* 7. Privacidade */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">7. Privacidade e Dados Pessoais</h2>
            <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
              <p>
                A coleta e tratamento de dados pessoais é realizada em conformidade 
                com a Lei Geral de Proteção de Dados (LGPD). Os dados são utilizados 
                exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Processar reservas e pagamentos</li>
                <li>Comunicação sobre a viagem contratada</li>
                <li>Envio de promoções (mediante consentimento)</li>
                <li>Cumprimento de obrigações legais</li>
              </ul>
              <p>
                Você pode solicitar acesso, correção ou exclusão de seus dados a 
                qualquer momento através do e-mail amorimturismo@ymai.com.
              </p>
            </div>
          </div>

          {/* 8. Programa de Afiliados */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">8. Programa de Afiliados</h2>
            <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
              <p>
                Os participantes do programa de afiliados estão sujeitos a termos 
                específicos, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Proibição de publicidade enganosa ou spam</li>
                <li>Respeito às diretrizes de uso da marca</li>
                <li>Comissões pagas apenas sobre vendas efetivadas</li>
                <li>Direito da empresa de encerrar parceria a qualquer momento</li>
              </ul>
            </div>
          </div>

          {/* 9. Disposições Finais */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-3">9. Disposições Finais</h2>
            <div className="space-y-3 text-[#6c757d] dark:text-[#adb5bd] text-sm leading-relaxed">
              <p>
                <strong className="text-[#212529] dark:text-[#f8f9fa]">9.1 Foro:</strong> Fica eleito o 
                foro da Comarca de Belo Horizonte/MG para dirimir quaisquer controvérsias 
                decorrentes destes termos.
              </p>
              <p>
                <strong className="text-[#212529] dark:text-[#f8f9fa]">9.2 Integralidade:</strong> Caso 
                qualquer disposição destes termos seja considerada inválida, as demais 
                permanecerão em pleno vigor.
              </p>
              <p>
                <strong className="text-[#212529] dark:text-[#f8f9fa]">9.3 Contato:</strong> Para dúvidas 
                sobre estes termos, entre em contato pelo e-mail amorimturismo@ymai.com.
              </p>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-[#d32f2f]/10 border border-[#d32f2f]/30 rounded-xl p-6">
            <p className="text-[#212529] dark:text-[#f8f9fa] text-sm">
              <strong>Ao utilizar nossos serviços, você declara ter lido, compreendido 
              e aceito integralmente estes Termos de Uso.</strong>
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
