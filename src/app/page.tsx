'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PackageGrid } from '@/components/packages';
import type { Package } from '@/types';
import { Bus, Shield, Clock, Star, MapPin, Phone, Mail, Search, Home as HomeIcon, Briefcase, Ticket, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Home() {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isDarkMode = resolvedTheme === 'dark';

  return (
    <div className="relative min-h-screen bg-[#f8f9fa] dark:bg-[#121212]">
      {/* Header Flutuante */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between">
          {/* Espaço vazio à esquerda para balancear */}
          <div className="w-24" />
          
          {/* Logo centralizada */}
          <Link href="/" className="flex items-center">
            <Image
              src="/amorim-logo.png"
              alt="Amorim Turismo"
              width={156}
              height={62}
              className="h-[52px] w-auto object-contain"
              priority
            />
          </Link>
          
          {/* Botões à direita */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-full h-10 w-10 text-white hover:bg-white/20 transition-colors"
            >
              {mounted && (isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
            </button>
            <button className="flex items-center justify-center rounded-full h-10 w-10 text-white hover:bg-white/20 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden min-h-[80vh]">
        {/* Imagem de fundo - Mobile */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: 'url(/hero-bus-mobile.jpg)' }}
        />
        {/* Imagem de fundo - Desktop */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
          style={{ backgroundImage: 'url(/hero-bus.jpg)' }}
        />
        
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/50" />
        
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

              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-white">
                Viaje com <span className="text-white">Conforto</span><br />
                e <span className="text-[#d32f2f]">Segurança</span>
              </h1>

              <p className="text-base text-gray-200 leading-relaxed">
                Descubra destinos incríveis com nossos pacotes de viagem personalizados.
                Ônibus modernos, roteiros especiais e preços acessíveis.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/pacotes">
                  <button className="bg-[#004a80] text-white h-14 px-8 rounded-xl font-semibold text-base hover:bg-[#003a66] transition-colors flex items-center gap-2 shadow-lg">
                    Ver Todos os Pacotes
                    <MapPin className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="#contato">
                  <button className="border-2 border-white bg-transparent text-white h-14 px-8 rounded-xl font-semibold text-base hover:bg-white/10 transition-colors">
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
      <section className="py-16 bg-[#f8f9fa] dark:bg-[#121212]">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-[#212529] dark:text-[#f8f9fa]">Por que escolher a Amorim Turismo?</h2>
            <p className="text-base text-[#6c757d] dark:text-[#adb5bd]">Conforto, segurança e experiências inesquecíveis</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Segurança Total',
                description: 'Ônibus modernos com seguro completo e motoristas experientes',
                color: 'text-[#004a80]'
              },
              {
                icon: Clock,
                title: 'Pontualidade',
                description: 'Horários rigorosamente cumpridos para sua tranquilidade',
                color: 'text-[#d32f2f]'
              },
              {
                icon: Star,
                title: 'Grupos e Eventos',
                description: 'Pacotes especiais para grupos, empresas e eventos',
                color: 'text-[#004a80]'
              },
              {
                icon: Bus,
                title: 'Programa de Afiliados',
                description: 'Indique amigos e ganhe comissões em cada viagem',
                color: 'text-[#d32f2f]'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
              >
                <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                <h3 className="text-xl font-bold mb-2 text-[#212529] dark:text-[#f8f9fa]">{feature.title}</h3>
                <p className="text-[#6c757d] dark:text-[#adb5bd]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pacotes em Destaque */}
      <section className="py-16 bg-[#f8f9fa] dark:bg-[#121212]">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-[#212529] dark:text-[#f8f9fa]">Pacotes em Destaque</h2>
            <p className="text-base text-[#6c757d] dark:text-[#adb5bd]">
              Confira nossas viagens mais procuradas e reserve seu lugar
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : featuredPackages.length > 0 ? (
            <PackageGrid packages={featuredPackages.slice(0, 6)} variant="featured" />
          ) : (
            <div className="text-center py-12">
              <p className="text-[#6c757d] dark:text-[#adb5bd]">Nenhum pacote em destaque no momento.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/pacotes">
              <button className="bg-[#004a80] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#003a66] transition-colors shadow-lg">
                Ver Todos os Destinos
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter/Contato */}
      <section id="contato" className="py-16 bg-[#004a80] text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-4">Pronto para sua próxima aventura?</h2>
              <p className="text-base opacity-90 mb-6">
                Cadastre-se agora e receba ofertas exclusivas direto no seu e-mail
              </p>

              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="flex-1 px-4 py-3 rounded-xl text-[#212529] bg-white focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
                />
                <button className="bg-[#d32f2f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b71c1c] transition-colors whitespace-nowrap">
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
                  <p className="opacity-90">(31) 99973-2079</p>
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
                  <p className="opacity-90">Contagem, MG</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 pb-24 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/amorim-logo.png"
                alt="Amorim Turismo"
                width={156}
                height={62}
                className="h-[52px] w-auto object-contain mb-4"
              />
              <p className="text-sm text-[#6c757d] dark:text-[#adb5bd]">
                Viaje com conforto e segurança. Descubra destinos incríveis com nossos pacotes exclusivos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#212529] dark:text-[#f8f9fa]">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                <li><Link href="/pacotes" className="hover:text-[#004a80] transition">Pacotes de Viagem</Link></li>
                <li><Link href="/frota" className="hover:text-[#004a80] transition">Nossa Frota</Link></li>
                <li><Link href="/afiliados" className="hover:text-[#004a80] transition">Seja um Afiliado</Link></li>
                <li><Link href="/sobre" className="hover:text-[#004a80] transition">Sobre Nós</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#212529] dark:text-[#f8f9fa]">Suporte</h4>
              <ul className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                <li><Link href="/faq" className="hover:text-[#004a80] transition">Perguntas Frequentes</Link></li>
                <li><Link href="/politicas" className="hover:text-[#004a80] transition">Políticas de Cancelamento</Link></li>
                <li><Link href="/termos" className="hover:text-[#004a80] transition">Termos de Uso</Link></li>
                <li><Link href="/contato" className="hover:text-[#004a80] transition">Fale Conosco</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#212529] dark:text-[#f8f9fa]">Contato</h4>
              <ul className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                <li>(31) 99973-2079 / (31) 98886-2079</li>
                <li>contato@amorimturismo.com.br</li>
                <li>Rua Manaus, 48 - Bairro Amazonas, Contagem - MG</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-[#6c757d] dark:text-[#adb5bd]">
            <p>© 2025 Amorim Turismo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation - sempre visível */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-20 items-center justify-around border-t border-[#e0e0e0]/50 dark:border-white/10 bg-[#F5F5F7] dark:bg-[#101622] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#D92E2E]">
          <HomeIcon className="w-6 h-6" />
          <p className="text-xs font-bold">Início</p>
        </Link>
        <Link href="/pacotes" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <Briefcase className="w-6 h-6" />
          <p className="text-xs font-medium">Pacotes</p>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <Ticket className="w-6 h-6" />
          <p className="text-xs font-medium">Minhas Viagens</p>
        </Link>
        <Link href="/dashboard/perfil" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <User className="w-6 h-6" />
          <p className="text-xs font-medium">Perfil</p>
        </Link>
      </nav>
    </div>
  );
}
