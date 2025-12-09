'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/header';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
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
  Star,
  Gift,
  Clock
} from 'lucide-react';

export default function AfiliadosPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implementar chamada à API
    setTimeout(() => {
      alert('Cadastro enviado! Você receberá um email em breve.');
      setIsSubmitting(false);
      setFormData({ name: '', email: '', phone: '', cpf: '' });
    }, 1500);
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Comissão de 7% + BÔNUS',
      description: 'Comece com 7% e ganhe até 10% de comissão conforme suas vendas aumentam!',
      highlight: true,
    },
    {
      icon: DollarSign,
      title: 'Pagamento em 48h via PIX',
      description: 'Dinheiro na conta em 2 dias úteis. Rápido, automático e sem burocracia.',
    },
    {
      icon: Trophy,
      title: 'Sistema de Bônus Progressivo',
      description: 'Venda mais e ganhe bônus em dinheiro + aumento permanente na comissão.',
      highlight: true,
    },
    {
      icon: Rocket,
      title: 'Material de Vendas GRÁTIS',
      description: 'Receba artes, vídeos e scripts prontos para turbinar suas vendas.',
    },
    {
      icon: Target,
      title: 'Vendas Recorrentes',
      description: 'Clientes satisfeitos voltam! Ganhe comissão em TODAS as compras futuras deles.',
    },
    {
      icon: Crown,
      title: 'Clube VIP de Afiliados',
      description: 'Top afiliados ganham viagens exclusivas, brindes e reconhecimento.',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Cadastre-se',
      description: 'Preencha o formulário abaixo e aguarde aprovação da nossa equipe.',
    },
    {
      step: '2',
      title: 'Receba seu Link',
      description: 'Após aprovado, você receberá seu código exclusivo de afiliado.',
    },
    {
      step: '3',
      title: 'Divulgue',
      description: 'Compartilhe seus pacotes favoritos com seu público usando seu link.',
    },
    {
      step: '4',
      title: 'Ganhe Comissão',
      description: 'Receba de 7% a 10% de comissão sobre cada venda realizada com seu código.',
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
              🔥 VAGAS LIMITADAS - Apenas 50 afiliados este mês!
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              Ganhe até{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/70 text-5xl md:text-7xl">
                R$ 5.000+/mês
              </span>
              <br />
              Vendendo Pacotes de Viagem
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl font-medium max-w-3xl mx-auto"
            >
              <span className="text-accent font-bold">NOVO:</span> Comissão inicial de 7% + bônus progressivos até 10%.
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
              <div className="text-4xl font-bold text-accent">R$ 127K+</div>
              <div className="text-sm text-muted-foreground">Pagos em comissões</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-primary">850+</div>
              <div className="text-sm text-muted-foreground">Vendas de afiliados</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-accent">R$ 2.847</div>
              <div className="text-sm text-muted-foreground">Comissão média/mês</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="text-4xl font-bold text-primary">48h</div>
              <div className="text-sm text-muted-foreground">Prazo de pagamento</div>
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
              EXCLUSIVO: Sistema de Bônus Progressivo
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold">
              Quanto Mais Você Vende,{' '}
              <span className="text-accent">Mais Você Ganha!</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Nosso sistema recompensa afiliados de alta performance com bônus em dinheiro e aumento permanente de comissão
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { 
                level: 'Iniciante', 
                sales: '1-5 vendas', 
                commission: '7%', 
                bonus: 'R$ 0',
                icon: Star,
                color: 'from-gray-500 to-gray-600'
              },
              { 
                level: 'Bronze', 
                sales: '6-15 vendas', 
                commission: '8%', 
                bonus: 'R$ 300',
                icon: Trophy,
                color: 'from-orange-500 to-orange-600'
              },
              { 
                level: 'Prata', 
                sales: '16-30 vendas', 
                commission: '9%', 
                bonus: 'R$ 800',
                icon: Crown,
                color: 'from-gray-400 to-gray-500'
              },
              { 
                level: 'Ouro', 
                sales: '31+ vendas', 
                commission: '10%', 
                bonus: 'R$ 1.500',
                icon: Zap,
                color: 'from-yellow-500 to-yellow-600'
              },
            ].map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-card border-2 ${
                  index === 3 ? 'border-yellow-500 shadow-2xl shadow-yellow-500/20 scale-105' : 'border-border'
                } rounded-xl p-6 space-y-4`}
              >
                {index === 3 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MAIS POPULAR
                    </span>
                  </div>
                )}
                
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${tier.color} text-white flex items-center justify-center mx-auto`}>
                  <tier.icon className="w-7 h-7" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">{tier.level}</h3>
                  <p className="text-sm text-muted-foreground">{tier.sales}</p>
                  
                  <div className="pt-3 border-t border-border space-y-1">
                    <div className="text-2xl font-bold text-accent">{tier.commission}</div>
                    <div className="text-xs text-muted-foreground">Comissão por venda</div>
                  </div>
                  
                  <div className="pt-2 space-y-1">
                    <div className="text-xl font-bold text-primary">{tier.bonus}</div>
                    <div className="text-xs text-muted-foreground">Bônus ao atingir</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-8 text-white text-center"
          >
            <Gift className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Bônus Especial de Lançamento! 🎁</h3>
            <p className="text-lg opacity-90">
              Os <span className="font-bold">primeiros 50 afiliados</span> que fizerem 3+ vendas nos primeiros 30 dias 
              ganham um <span className="font-bold">bônus extra de R$ 300</span> + kit de materiais premium!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Por que a Amorim é a Melhor Escolha?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comparamos com TODAS as outras agências. Nós pagamos mais, pagamos mais rápido.
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

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container-custom">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Afiliados Reais, Resultados Reais
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja o que nossos afiliados estão ganhando agora
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Maria Silva',
                role: 'Influencer Digital',
                avatar: '👩‍💼',
                earnings: 'R$ 4.200',
                period: 'último mês',
                sales: 12,
                quote: 'Nunca pensei que seria tão fácil! Só compartilho nas minhas redes e o dinheiro cai na conta.'
              },
              {
                name: 'João Santos',
                role: 'Criador de Conteúdo',
                avatar: '👨‍💻',
                earnings: 'R$ 7.850',
                period: 'último mês',
                sales: 23,
                quote: 'Comecei há 3 meses e já está pagando meu aluguel. Melhor decisão que tomei!'
              },
              {
                name: 'Ana Costa',
                role: 'Vendedora Autônoma',
                avatar: '👩‍🦱',
                earnings: 'R$ 11.300',
                period: 'último mês',
                sales: 38,
                quote: 'Saí do meu emprego CLT. Ganho mais, trabalho menos e no meu horário. Liberdade total!'
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 space-y-4 hover:shadow-xl transition-smooth"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                  <div className="text-yellow-500 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>

                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center space-y-1">
                  <div className="text-3xl font-bold text-accent">{testimonial.earnings}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.sales} vendas no {testimonial.period}
                  </div>
                </div>

                <p className="text-muted-foreground italic">
                  "{testimonial.quote}"
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-lg font-medium mb-4">
              <span className="text-accent font-bold">+ 127 afiliados</span> já estão ganhando com a gente
            </p>
            <div className="flex justify-center gap-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-accent/50 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section id="cadastro" className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white text-sm font-bold animate-pulse"
              >
                <Clock className="w-4 h-4" />
                ⏰ Apenas 17 vagas restantes este mês!
              </motion.div>

              <h2 className="text-3xl md:text-5xl font-bold">
                Comece a Ganhar <span className="text-accent">HOJE</span>
              </h2>
              <p className="text-lg">
                <span className="font-bold">100% GRATUITO</span> • Aprovação em até 24h • Sem burocracia
              </p>
              
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-4 mt-6">
                <p className="font-medium">
                  🎯 <span className="text-accent font-bold">GARANTIA:</span> Se você não fizer sua primeira venda em 30 dias, 
                  te damos <span className="font-bold">R$ 100 em créditos</span> para anúncios!
                </p>
              </div>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-xl p-8 space-y-6 shadow-lg"
            >
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cpf" className="block text-sm font-medium">
                    CPF *
                  </label>
                  <input
                    type="text"
                    id="cpf"
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Ao enviar este formulário, você concorda com nossos termos de afiliado e política de privacidade.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-5 bg-gradient-to-r from-accent to-accent/80 text-white text-lg rounded-lg font-bold hover:shadow-2xl hover:shadow-accent/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando seu cadastro...
                  </>
                ) : (
                  <>
                    🚀 QUERO COMEÇAR A GANHAR AGORA!
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
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
            </motion.form>
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
                  a: 'As comissões são pagas via PIX em até 48h após a confirmação da venda pelo cliente.',
                },
                {
                  q: 'Qual o valor da comissão?',
                  a: 'Você começa com 7% e pode chegar a 10% conforme aumenta suas vendas. A comissão é calculada sobre o valor total de cada pacote.',
                },
                {
                  q: 'Posso divulgar em redes sociais?',
                  a: 'Sim! Você pode divulgar em qualquer canal: Instagram, Facebook, WhatsApp, YouTube, etc.',
                },
                {
                  q: 'Quanto tempo leva para aprovação?',
                  a: 'Analisamos todos os cadastros em até 24 horas úteis.',
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
              href="https://wa.me/5511999999999"
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
              <p className="text-muted-foreground text-sm">(11) 99999-9999</p>
              <p className="text-xs text-muted-foreground mt-2">Resposta rápida!</p>
            </motion.a>

            <motion.a
              href="mailto:afiliados@amorimturismo.com.br"
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
              <p className="text-muted-foreground text-sm">afiliados@amorimturismo.com.br</p>
              <p className="text-xs text-muted-foreground mt-2">Respondemos em até 24h</p>
            </motion.a>

            <motion.a
              href="tel:+551199999999"
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
              <p className="text-muted-foreground text-sm">(11) 9999-9999</p>
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
              OFERTA POR TEMPO LIMITADO
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              ⚠️ Esta oportunidade pode não estar disponível amanhã
            </h3>
            <p className="text-lg opacity-90">
              Estamos limitando em <span className="font-bold">50 afiliados por mês</span> para garantir suporte premium.
              <br />
              Não perca sua vaga!
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
                Sua Nova Fonte de Renda<br />Começa AGORA! 💰
              </h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Enquanto você está lendo isso, <span className="font-bold">nossos afiliados estão faturando</span>.
                <br />
                Não fique de fora dessa oportunidade de ouro!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a
                  href="#cadastro"
                  className="inline-flex items-center gap-2 px-10 py-5 bg-white text-primary rounded-lg text-lg font-bold hover:bg-white/90 hover:scale-110 transition-all shadow-2xl"
                >
                  SIM! QUERO SER AFILIADO AGORA
                  <ArrowRight className="w-6 h-6" />
                </a>
              </div>

              <div className="pt-6 space-y-2">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Cadastro em 2 minutos
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Aprovação em 24h
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Comissões em 48h
                  </span>
                </div>
                <p className="text-xs opacity-75">
                  🔒 Seus dados estão 100% protegidos pela LGPD
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
