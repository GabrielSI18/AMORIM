'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bus, Search, Home, Briefcase, Ticket, User, Moon, Sun } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Package } from '@/types';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('destaques');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const categories = [
    { id: 'destaques', name: 'Destaques' },
    { id: 'nordeste', name: 'Nordeste' },
    { id: 'sudeste', name: 'Sudeste' },
    { id: 'feriados', name: 'Feriados' },
    { id: 'sul', name: 'Sul' },
  ];

  useEffect(() => {
    // Verificar tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [selectedCategory]);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ status: 'published' });
      if (selectedCategory !== 'destaques') {
        params.append('category', selectedCategory);
      }
      
      const response = await fetch(`/api/packages?${params}`);
      const data = await response.json();
      setPackages(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar pacotes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F5F5F7] dark:bg-[#101622]">
      {/* Header Sticky */}
      <header className="sticky top-0 z-10 flex items-center bg-[#F5F5F7]/80 dark:bg-[#101622]/80 p-4 backdrop-blur-sm border-b border-[#e0e0e0]/50 dark:border-white/10">
        <Link href="/" className="flex size-10 shrink-0 items-center justify-center">
          <Image
            src="/favicon.ico"
            alt="Amorim Turismo"
            width={32}
            height={32}
            className="object-contain"
          />
        </Link>
        <h1 className="text-[#1A2E40] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Pacotes de Viagem
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-full h-10 w-10 text-[#1A2E40] dark:text-white hover:bg-[#1A2E40]/10 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="flex items-center justify-center rounded-full h-10 w-10 text-[#1A2E40] dark:text-white hover:bg-[#1A2E40]/10 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pb-24">
        {/* Chips de Filtro */}
        <div className="flex gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 transition-all ${
                selectedCategory === category.id
                  ? 'bg-[#D92E2E] text-white font-semibold'
                  : 'bg-[#1A2E40]/10 dark:bg-white/10 text-[#1A2E40] dark:text-[#E0E0E0] font-medium hover:bg-[#1A2E40]/20'
              }`}
            >
              <p className="text-sm leading-normal">{category.name}</p>
            </button>
          ))}
        </div>

        {/* Lista de Pacotes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {packages.length === 0 ? (
              <p className="text-center text-[#4F4F4F] dark:text-[#E0E0E0] py-10">
                Nenhum pacote encontrado
              </p>
            ) : (
              packages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/pacotes/${pkg.slug}`}
                  className="flex flex-col items-stretch justify-start rounded-xl bg-white dark:bg-[#1A2E40] shadow-md hover:shadow-lg transition-shadow"
                >
                  {/* Imagem */}
                  <div className="relative w-full aspect-video bg-cover bg-center rounded-t-xl overflow-hidden">
                    {pkg.images?.[0] ? (
                      <Image
                        src={pkg.images[0]}
                        alt={pkg.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A2E40] to-[#D92E2E]" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex w-full flex-col gap-2 p-4">
                    <p className="text-[#D92E2E] text-sm font-semibold leading-normal">
                      {pkg.category?.name || 'Destaque'}
                    </p>
                    <p className="text-[#1A2E40] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                      {pkg.name}
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className="text-[#4F4F4F] dark:text-[#E0E0E0] text-base font-normal leading-normal">
                        {pkg.duration} dias{pkg.includes_hotel ? ', inclui hotel' : ''}
                      </p>
                      {pkg.departure_city && (
                        <p className="text-[#4F4F4F] dark:text-[#E0E0E0] text-base font-normal leading-normal">
                          Saída de {pkg.departure_city}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 justify-between mt-2">
                      <p className="text-[#1A2E40] dark:text-white text-lg font-bold">
                        A partir de R$ {pkg.price?.toLocaleString('pt-BR') || '0'}
                      </p>
                      <span className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-5 bg-[#D92E2E] text-white text-sm font-bold leading-normal hover:bg-[#A62424] transition-colors">
                        Ver Detalhes
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex h-20 items-center justify-around border-t border-[#e0e0e0]/50 dark:border-white/10 bg-[#F5F5F7]/80 dark:bg-[#101622]/80 backdrop-blur-sm">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <Home className="w-6 h-6" />
          <p className="text-xs font-medium">Início</p>
        </Link>
        <Link href="/pacotes" className="flex flex-col items-center gap-1 text-[#D92E2E]">
          <Briefcase className="w-6 h-6" />
          <p className="text-xs font-bold">Pacotes</p>
        </Link>
        <Link href="/minhas-viagens" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <Ticket className="w-6 h-6" />
          <p className="text-xs font-medium">Minhas Viagens</p>
        </Link>
        <Link href="/perfil" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <User className="w-6 h-6" />
          <p className="text-xs font-medium">Perfil</p>
        </Link>
      </nav>
    </div>
  );
}
