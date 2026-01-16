'use client'

import { Users, Target, Award, Heart, MapPin, Phone, Mail } from 'lucide-react'
import { PublicLayout } from '@/components/layout'

export default function SobrePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#004a80] to-[#003a66] py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Sobre a Amorim Turismo
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Há mais de 20 anos transformando sonhos em destinos inesquecíveis
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#212529] dark:text-[#f8f9fa] mb-6">Nossa História</h2>
              <div className="space-y-4 text-[#6c757d] dark:text-[#adb5bd]">
                <p>
                  A Amorim Turismo nasceu da paixão por explorar o mundo e do desejo de 
                  compartilhar experiências únicas com nossos clientes. Fundada há mais de 
                  20 anos, começamos como uma pequena agência familiar e crescemos para nos tornar 
                  referência em turismo de qualidade em Minas Gerais.
                </p>
                <p>
                  Nossa missão é proporcionar viagens memoráveis, com atendimento 
                  personalizado e preços justos. Acreditamos que cada viagem é uma 
                  oportunidade de criar memórias que duram para sempre.
                </p>
                <p>
                  Ao longo dos anos, já ajudamos milhares de famílias a realizarem 
                  o sonho de conhecer destinos incríveis, sempre com segurança, 
                  conforto e a melhor experiência possível.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#d32f2f] mb-2">20+</div>
                <div className="text-[#6c757d] dark:text-[#adb5bd] text-sm">Anos de experiência</div>
              </div>
              <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#d32f2f] mb-2">5.000+</div>
                <div className="text-[#6c757d] dark:text-[#adb5bd] text-sm">Clientes satisfeitos</div>
              </div>
              <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#d32f2f] mb-2">100+</div>
                <div className="text-[#6c757d] dark:text-[#adb5bd] text-sm">Destinos disponíveis</div>
              </div>
              <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#d32f2f] mb-2">98%</div>
                <div className="text-[#6c757d] dark:text-[#adb5bd] text-sm">Taxa de satisfação</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-[#212529] dark:text-[#f8f9fa] text-center mb-12">Nossos Valores</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d32f2f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-[#d32f2f]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Paixão</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                Amamos o que fazemos e isso reflete em cada viagem que organizamos
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#004a80]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#004a80]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Atendimento</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                Tratamos cada cliente como único, com atenção e cuidado personalizados
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d32f2f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[#d32f2f]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Qualidade</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                Buscamos sempre os melhores parceiros e serviços para nossos clientes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#004a80]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-[#004a80]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Confiança</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                Transparência e honestidade são a base do nosso relacionamento
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-[#212529] dark:text-[#f8f9fa] text-center mb-12">Entre em Contato</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-[#d32f2f]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Endereço</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                Rua Manaus, 48 - Amazonas, Contagem - MG
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-[#d32f2f]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Telefone</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                (31) 99973-2079
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-[#d32f2f]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212529] dark:text-[#f8f9fa] mb-2">Email</h3>
              <p className="text-[#6c757d] dark:text-[#adb5bd] text-sm">
                amorimturismo@ymai.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
