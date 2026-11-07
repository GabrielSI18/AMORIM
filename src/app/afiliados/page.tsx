'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/header';
import { useSiteConfig } from '@/hooks/use-site-config';
import {
  DollarSign,
  Users,
  Share2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Percent,
  Wallet,
  BarChart3,
  Zap,
  Trophy,
  Target,
  Rocket,
  Crown,
  Gift,
  Clock,
  Lock
} from 'lucide-react';

export default function AfiliadosPage() {
  const config = useSiteConfig();

  // O cadastro de afiliado agora exige conta de cliente. Toda a tela é
  // landing + CTA para `/sign-up`; depois do cadastro Clerk o usuário cai
  // em `/dashboard/parceiro` que mostra um form curto pra completar o
  // perfil de afiliado (CPF, PIX, cidade, Instagram, etc).
  const signupUrl = '/sign-up?redirect_url=' + encodeURIComponent('/dashboard/parceiro')

  const benefits = [
    {
      icon: Zap,
      title: 'Comissão de 7% por venda',
      description: 'Você ganha 7% do valor de cada pacote vendido pelo seu link.',
      highlight: true,
    },
    {
      icon: DollarSign,
      title: 'Pagamento via PIX',
      description: 'A comissão é paga na chave PIX que você cadastra, depois que a viagem do cliente acontece.',
    },
    {
      icon: Trophy,
      title: 'Quanto mais vende, mais ganha',
      description: 'Não tem limite de indicações: cada venda pelo seu link é mais uma comissão no seu PIX.',
      highlight: true,
    },
    {
      icon: Rocket,
      title: 'Material de divulgação',
      description: 'A equipe envia fotos e vídeos dos pacotes para você usar nas suas redes.',
    },
    {
      // Não existe comissão vitalícia no sistema: o que vale é a janela de 30
      // dias do link (ver AFFILIATE_COOKIE_DAYS). O texto antigo prometia
      // comissão em "todas as compras futuras" e geraria cobrança do parceiro.
      icon: Target,
      title: 'Indicação vale por 30 dias',
      description: 'Quem abrir o seu link tem 30 dias para fechar a viagem — e a venda continua sendo sua.',
    },
    {
      icon: Crown,
      title: 'Painel do parceiro',
      description: 'Acompanhe cada indicação, o status da comissão e quanto tem a receber.',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Cadastre-se',
      description: 'Crie sua conta, complete os dados e aguarde a aprovação da equipe (até 24h úteis).',
    },
    {
      step: '2',
      title: 'Receba seu Link',
      description: 'Assim que a equipe aprovar, avisamos você pelo WhatsApp e seu código já aparece no painel.',
    },
    {
      step: '3',
      title: 'Divulgue',
      description: 'Compartilhe seus pacotes favoritos com seu público usando seu link.',
    },
    {
      step: '4',
      title: 'Ganhe Comissão',
      description: 'Receba 7% de comissão sobre cada venda realizada com o seu link.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent to-accent/80 text-white text-sm font-bold shadow-lg"
            >
              <Zap className="w-4 h-4" />
              Programa de parceiros da Amorim Turismo
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              Indique viagens e{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/70 text-5xl md:text-7xl">
                ganhe comissão
              </span>
              <br />
              em cada venda
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl font-medium max-w-3xl mx-auto"
            >
              Comissão de 7% em cada venda. Quanto mais você vende, mais você ganha.
              <br />
              <span className="text-muted-foreground text-lg">
                Trabalhe de casa, no seu tempo, sem investimento inicial.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center pt-4"
            >
              <a
                href="#cadastro"
                className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-smooth flex items-center gap-2"
              >
                Quero ser Afiliado
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#como-funciona"
                className="px-8 py-3 border border-border rounded-lg font-medium hover:bg-muted/50 transition-smooth"
              >
                Como Funciona
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gradient-to-r from-accent/10 to-primary/10">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-accent">7%</div>
              <div className="text-sm text-muted-foreground">Comissão por venda</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-primary">R$ 0</div>
              <div className="text-sm text-muted-foreground">Custo para participar</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-accent">30 dias</div>
              <div className="text-sm text-muted-foreground">
                O cliente tem esse prazo para comprar pelo seu link
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-primary">PIX</div>
              <div className="text-sm text-muted-foreground">Pagamento da comissão</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bonus System */}
      <section className="py-20 bg-gradient-to-br from-accent/5 via-primary/5 to-background">
        <div className="container-custom">
          <div className="text-center space-y-4 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold"
            >
              <Trophy className="w-4 h-4" />
              Sua comissão
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Quanto Mais Você Vende,{' '}
              <span className="text-accent">Mais Você Ganha!</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Cada pacote vendido pelo seu link rende 7% do valor para você, e não tem limite de vendas.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-8 text-white text-center"
          >
            <Gift className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Como a comissão é paga</h3>
            <p className="text-lg opacity-90">
              A comissão entra como <span className="font-bold">pendente</span> assim que a reserva é feita pelo seu link.
              Quando o cliente paga, ela fica <span className="font-bold">retida até a viagem</span> e é
              <span className="font-bold"> liberada para pagamento via PIX</span> no dia seguinte à saída do ônibus.
              Se o cliente cancelar antes, a comissão é cancelada junto. Você acompanha cada etapa pelo painel do parceiro.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Por que vale a pena indicar a Amorim
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comissão em dinheiro, paga por PIX, com acompanhamento no painel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-card border-2 ${
                  benefit.highlight ? 'border-accent shadow-lg shadow-accent/10' : 'border-border'
                } rounded-lg p-6 space-y-4 hover:shadow-xl hover:scale-105 transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-lg ${
                  benefit.highlight ? 'bg-accent text-white' : 'bg-primary/10 text-primary'
                } flex items-center justify-center`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
                {benefit.highlight && (
                  <div className="flex items-center gap-2 text-accent text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Destaque do programa
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-20">
        <div className="container-custom">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Como Funciona?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece a ganhar em 4 passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card border border-border rounded-lg p-6 space-y-4 h-full">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>

                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quanto rende
          Esta seção já teve "depoimentos" de afiliados inventados (nomes,
          fotos e ganhos que não existiam e que não fechavam com a própria
          tabela de comissão). Além de propaganda enganosa, é o tipo de
          promessa de renda que faz o Meta e o Google reprovarem o anúncio.
          No lugar entrou a conta real, que qualquer pessoa confere. */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container-custom">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Quanto rende, na conta
            </h2>
            <p className="text-lg text-muted-foreground">
              Sem promessa de renda: a comissão é um percentual do valor do pacote vendido.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Percent,
                destaque: 'R$ 104,30',
                titulo: 'por pacote de R$ 1.490',
                texto: 'É o que rende uma venda com a comissão de 7%. Pacote mais caro, comissão maior.',
              },
              {
                icon: Wallet,
                destaque: 'PIX',
                titulo: 'depois que a viagem acontece',
                texto: 'A comissão fica retida até o cliente viajar e é liberada no dia seguinte à saída do ônibus.',
              },
              {
                icon: Clock,
                destaque: '30 dias',
                titulo: 'de validade do seu link',
                texto: 'Quem clica no seu link tem 30 dias para fechar a viagem e a venda continua sendo sua.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 space-y-4 hover:shadow-xl transition-smooth"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">{item.destaque}</div>
                  <div className="text-sm font-medium">{item.titulo}</div>
                </div>
                <p className="text-muted-foreground">{item.texto}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Section
          Antes esta seção tinha um <form> que criava um Affiliate "órfão"
          (sem User vinculado), e o cliente depois precisava criar conta no
          Clerk separadamente — fluxo confuso. Agora levamos direto para
          /sign-up com redirect_url=/dashboard/parceiro: o cliente cria a
          conta uma vez e cai num form curto pra completar o cadastro de
          afiliado já vinculado à sua conta. */}
      <section id="cadastro" className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white text-sm font-bold"
              >
                <Sparkles className="w-4 h-4" />
                Cadastro gratuito • Aprovação em até 24h úteis
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-bold">
                Comece a Ganhar <span className="text-accent">HOJE</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Crie sua conta gratuita, complete o cadastro de parceiro e receba
                seu código de afiliado.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-lg"
            >
              {/* Passos */}
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-white font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="font-semibold">Crie sua conta gratuita</p>
                    <p className="text-sm text-muted-foreground">Email, senha e seus dados básicos. Leva 1 minuto.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-white font-bold flex items-center justify-center">2</span>
                  <div>
                    <p className="font-semibold">Complete o cadastro de parceiro</p>
                    <p className="text-sm text-muted-foreground">CPF, chave PIX, cidade, Instagram (opcional). Tudo no painel.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-white font-bold flex items-center justify-center">3</span>
                  <div>
                    <p className="font-semibold">Receba seu link e comece a divulgar</p>
                    <p className="text-sm text-muted-foreground">Acompanhe vendas e comissões em tempo real.</p>
                  </div>
                </li>
              </ol>

              <Link
                href={signupUrl}
                className="w-full px-8 py-5 bg-gradient-to-r from-accent to-accent/80 text-white text-lg rounded-lg font-bold hover:shadow-2xl hover:shadow-accent/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Quero Ser Parceiro Agora
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <Link href="/sign-in?redirect_url=/dashboard/parceiro" className="text-accent font-semibold hover:underline">
                  Entrar e completar cadastro
                </Link>
              </p>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Grátis para sempre
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Sem taxa de adesão
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Cancele quando quiser
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'Preciso pagar algo para me tornar afiliado?',
                  a: 'Não! O cadastro é 100% gratuito. Você só precisa se cadastrar e começar a divulgar.',
                },
                {
                  q: 'Como recebo minhas comissões?',
                  a: 'Quando o cliente paga a reserva, a comissão fica retida até a viagem acontecer. No dia seguinte à saída do ônibus ela é liberada e enviada por PIX para a chave cadastrada no seu painel. Se o cliente cancelar antes da viagem, a comissão é cancelada junto com a reserva.',
                },
                {
                  q: 'Qual o valor da comissão?',
                  a: 'Você ganha 7% do valor total de cada pacote vendido pelo seu link. Quanto mais você vende, mais você ganha: não tem limite de vendas.',
                },
                {
                  q: 'Meu link de divulgação vence?',
                  a: 'Não. Seu link e seu código são seus e valem para sempre. O prazo de 30 dias é outra coisa: quando alguém clica no seu link, o site guarda a sua indicação por 30 dias. Se essa pessoa fechar a reserva dentro desse prazo, a comissão é sua, mesmo que ela volte ao site depois por outro caminho. Passados os 30 dias sem comprar, ela precisa entrar pelo seu link de novo para a venda contar para você.',
                },
                {
                  q: 'E se o mesmo cliente viajar de novo mais pra frente?',
                  a: 'A indicação vale para a reserva que ele fechou. Em uma viagem nova, peça para ele entrar outra vez pelo seu link ou informar o seu código na reserva — assim essa venda também fica no seu nome.',
                },
                {
                  q: 'Posso divulgar em redes sociais?',
                  a: 'Sim! Você pode divulgar em qualquer canal: Instagram, Facebook, WhatsApp, YouTube, etc.',
                },
                {
                  q: 'Quanto tempo leva para aprovação?',
                  a: 'Analisamos todos os cadastros em até 24 horas úteis e avisamos você pelo WhatsApp assim que aprovar. Seu código também aparece no painel do parceiro.',
                },
              ].map((faq, index) => (
                <motion.details
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-lg p-6 group"
                >
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                    {faq.q}
                    <ArrowRight className="w-5 h-5 transform group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-4 text-muted-foreground">{faq.a}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ainda tem dúvidas?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Entre em contato com nossa equipe. Estamos prontos para ajudar!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.a
              href={`https://wa.me/${config.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors group"
            >
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
              <p className="text-muted-foreground text-sm">{config.phone_primary}</p>
              <p className="text-xs text-muted-foreground mt-2">Resposta rápida!</p>
            </motion.a>

            <motion.a
              href={`mailto:${config.email_affiliates}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors group"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">E-mail</h3>
              <p className="text-muted-foreground text-sm">{config.email_affiliates}</p>
              <p className="text-xs text-muted-foreground mt-2">Respondemos em até 24h</p>
            </motion.a>

            <motion.a
              href={`tel:+${config.whatsapp_number}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors group"
            >
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Telefone</h3>
              <p className="text-muted-foreground text-sm">{config.phone_primary}</p>
              <p className="text-xs text-muted-foreground mt-2">Seg a Sex, 9h às 18h</p>
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8"
          >
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Ou acesse nossa página de contato completa
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Urgency Banner */}
      <section className="py-12 bg-gradient-to-r from-accent via-accent/90 to-accent">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-bold">
              <Zap className="w-4 h-4" />
              COMO PARTICIPAR
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
Cadastro simples, com aprovação da nossa equipe
            </h3>
            <p className="text-lg opacity-90">
Crie sua conta, preencha os dados de pagamento e aguarde a aprovação.
              <br />
              Depois disso seu link fica disponível no painel.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl p-12 text-center text-white space-y-8 relative overflow-hidden"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 space-y-6">
              <Rocket className="w-16 h-16 mx-auto" />
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
Comece a indicar viagens<br />da Amorim Turismo
              </h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
Sem custo para participar e sem meta mínima.
                <br />
Você indica, o cliente viaja e você recebe a comissão.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a
                  href="#cadastro"
                  className="inline-flex items-center gap-2 px-10 py-5 bg-white text-primary rounded-lg text-lg font-bold hover:bg-white/90 hover:scale-110 transition-all shadow-2xl"
                >
                  QUERO SER PARCEIRO
                  <ArrowRight className="w-6 h-6" />
                </a>
              </div>

              <div className="pt-6 space-y-2">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Cadastro em 2 minutos
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Aprovação em 24h úteis
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Comissão por PIX
                  </span>
                </div>
                <p className="text-xs opacity-75 flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Seus dados são tratados conforme a LGPD
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
