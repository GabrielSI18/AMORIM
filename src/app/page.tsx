'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/header';
import { PackageGrid } from '@/components/packages';
import type { Package } from '@/types';
import { Bus, Shield, Clock, Star, MapPin, Phone, Mail } from 'lucide-react';

export default function Home() {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/packages?featured=true&status=published')
      .then(res => res.json())
      .then(data => {
        setFeaturedPackages(data.data || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar pacotes:', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[700px]">
        {/* Imagem de fundo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bus.jpg)' }}
        />
        
        {/* Overlay escuro forte para contraste */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/60" />
        
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Conteúdo */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium border border-white/30 shadow-lg">
                <Star className="h-4 w-4" />
                Mais de 20 anos de experiência
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white" style={{ textShadow: '2px 4px 8px rgba(0,0,0,0.8)' }}>
                Viaje com <span className="text-[oklch(0.60_0.18_245)]">Conforto</span><br />
                e <span className="text-[oklch(0.65_0.20_25)]">Segurança</span>
              </h1>

              <p className="text-xl text-white leading-relaxed font-medium" style={{ textShadow: '1px 2px 6px rgba(0,0,0,0.8)' }}>
                Descubra destinos incríveis com nossos pacotes de viagem personalizados.
                Ônibus modernos, roteiros especiais e preços acessíveis.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/pacotes">
                  <button className="bg-accent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-smooth flex items-center gap-2 shadow-2xl">
                    Ver Todos os Pacotes
                    <MapPin className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="#contato">
                  <button className="border-2 border-white bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-smooth shadow-xl">
                    Fale Conosco
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Espaço para destacar o ônibus da imagem */}
            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Por que escolher a Amorim Turismo?</h2>
            <p className="text-xl text-muted-foreground">Conforto, segurança e experiências inesquecíveis</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Segurança Total',
                description: 'Ônibus modernos com seguro completo e motoristas experientes',
                color: 'text-primary'
              },
              {
                icon: Clock,
                title: 'Pontualidade',
                description: 'Horários rigorosamente cumpridos para sua tranquilidade',
                color: 'text-accent'
              },
              {
                icon: Star,
                title: 'Grupos e Eventos',
                description: 'Pacotes especiais para grupos, empresas e eventos',
                color: 'text-primary'
              },
              {
                icon: Bus,
                title: 'Programa de Afiliados',
                description: 'Indique amigos e ganhe comissões em cada viagem',
                color: 'text-accent'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-smooth"
              >
                <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pacotes em Destaque */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Pacotes em Destaque</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Confira nossas viagens mais procuradas e reserve seu lugar
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[500px] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : featuredPackages.length > 0 ? (
            <PackageGrid packages={featuredPackages.slice(0, 6)} variant="featured" />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pacote em destaque no momento.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/pacotes">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-smooth">
                Ver Todos os Destinos
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter/Contato */}
      <section id="contato" className="py-20 bg-gradient-primary text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-4">Pronto para sua próxima aventura?</h2>
              <p className="text-lg opacity-90 mb-6">
                Cadastre-se agora e receba ofertas exclusivas direto no seu e-mail
              </p>

              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="flex-1 px-6 py-4 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button className="bg-accent text-accent-foreground px-8 py-4 rounded-lg font-semibold hover:bg-accent/90 transition-smooth whitespace-nowrap">
                  Cadastrar
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Telefone</p>
                  <p className="opacity-90">(31) 99999-9999</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6" />
                <div>
                  <p className="font-semibold">E-mail</p>
                  <p className="opacity-90">contato@amorimturismo.com.br</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Localização</p>
                  <p className="opacity-90">Belo Horizonte, MG</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Amorim Turismo</h3>
              <p className="text-sm text-muted-foreground">
                Viaje com conforto e segurança. Descubra destinos incríveis com nossos pacotes exclusivos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pacotes" className="hover:text-primary transition">Pacotes de Viagem</Link></li>
                <li><Link href="/afiliados" className="hover:text-primary transition">Seja um Afiliado</Link></li>
                <li><Link href="/sobre" className="hover:text-primary transition">Sobre Nós</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/faq" className="hover:text-primary transition">Perguntas Frequentes</Link></li>
                <li><Link href="/politicas" className="hover:text-primary transition">Políticas de Cancelamento</Link></li>
                <li><Link href="/termos" className="hover:text-primary transition">Termos de Uso</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>(31) 99999-9999</li>
                <li>contato@amorimturismo.com.br</li>
                <li>Belo Horizonte, MG</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Amorim Turismo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
