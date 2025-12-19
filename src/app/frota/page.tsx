'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Bus, Users, Layers, Calendar, ChevronLeft, ChevronRight, X, Search, Home as HomeIcon, Briefcase, Ticket, User, Moon, Sun } from 'lucide-react'

interface BusData {
  id: string
  model: string
  year: number
  plate: string
  seats: number
  floors: number
  photos: string[]
  isActive: boolean
}

export default function FrotaPage() {
  const [buses, setBuses] = useState<BusData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchFleet() {
      try {
        const response = await fetch('/api/fleet?active=true')
        const result = await response.json()
        if (result.data) {
          setBuses(result.data)
        }
      } catch (error) {
        console.error('Erro ao carregar frota:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFleet()
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDarkMode = resolvedTheme === 'dark'

  const openGallery = (bus: BusData) => {
    setSelectedBus(bus)
    setCurrentPhotoIndex(0)
  }

  const closeGallery = () => {
    setSelectedBus(null)
    setCurrentPhotoIndex(0)
  }

  const nextPhoto = () => {
    if (selectedBus) {
      setCurrentPhotoIndex((prev) => 
        prev === selectedBus.photos.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevPhoto = () => {
    if (selectedBus) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? selectedBus.photos.length - 1 : prev - 1
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#101622]">
      {/* Header Flutuante - igual à tela inicial */}
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
      <section className="relative pt-20 pb-16 bg-gradient-to-br from-[#004a80] to-[#002d4d] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/pattern-bus.svg')] bg-repeat" />
        </div>
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center pt-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
              <Bus className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Nossa Frota</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Viaje com conforto e segurança. Conheça os veículos modernos que fazem parte da nossa frota.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Fleet Grid */}
      <section className="py-16">
        <div className="container-custom">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 mb-4" />
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-3/4 mb-2" />
                  <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : buses.length === 0 ? (
            <div className="text-center py-16">
              <Bus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Nenhum veículo disponível
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Em breve teremos mais informações sobre nossa frota.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {buses.map((bus, index) => (
                <motion.div
                  key={bus.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-white dark:bg-[#192233] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div 
                    className="relative h-64 bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden"
                    onClick={() => bus.photos.length > 0 && openGallery(bus)}
                  >
                    {bus.photos.length > 0 ? (
                      <>
                        <Image
                          src={bus.photos[0]}
                          alt={bus.model}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {bus.photos.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            +{bus.photos.length - 1} fotos
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Bus className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    
                    {/* Badge de andares */}
                    {bus.floors === 2 && (
                      <div className="absolute top-3 left-3 bg-[#D92E2E] text-white text-xs font-bold px-3 py-1 rounded-full">
                        Double Decker
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1A2E40] dark:text-white mb-4">
                      {bus.model}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-[#004a80]/10 dark:bg-[#004a80]/30">
                          <Users className="w-5 h-5 text-[#004a80]" />
                        </div>
                        <p className="text-lg font-bold text-[#1A2E40] dark:text-white">{bus.seats}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Assentos</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-[#004a80]/10 dark:bg-[#004a80]/30">
                          <Layers className="w-5 h-5 text-[#004a80]" />
                        </div>
                        <p className="text-lg font-bold text-[#1A2E40] dark:text-white">{bus.floors}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{bus.floors === 1 ? 'Andar' : 'Andares'}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-[#004a80]/10 dark:bg-[#004a80]/30">
                          <Calendar className="w-5 h-5 text-[#004a80]" />
                        </div>
                        <p className="text-lg font-bold text-[#1A2E40] dark:text-white">{bus.year}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ano</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-[#192233]">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-[#1A2E40] dark:text-white mb-12">
            Conforto e Segurança em Primeiro Lugar
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🛋️', title: 'Poltronas Reclináveis', desc: 'Semi-leito e leito total para máximo conforto' },
              { icon: '❄️', title: 'Ar Condicionado', desc: 'Climatização em todos os veículos' },
              { icon: '🔌', title: 'Carregador USB', desc: 'Carregue seu celular durante a viagem' },
              { icon: '🧊', title: 'Frigobar', desc: 'Bebidas geladas disponíveis' },
              { icon: '🚻', title: 'Banheiro', desc: 'Banheiro em todos os ônibus' },
              { icon: '🦵', title: 'Descanso de Pernas', desc: 'Apoio para pernas nos modelos executivos' },
              { icon: '🚌', title: 'Double Decker', desc: 'Ônibus de 2 andares com leito total' },
              { icon: '✨', title: 'Frota Moderna', desc: 'Veículos revisados e bem cuidados' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-[#1A2E40] dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {/* CTA */}
      <section className="py-16 pb-28">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-[#1A2E40] dark:text-white mb-4">
            Pronto para sua próxima viagem?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Confira nossos pacotes de viagem e embarque em uma experiência inesquecível.
          </p>
          <Link
            href="/pacotes"
            className="inline-flex items-center gap-2 bg-[#D92E2E] hover:bg-[#b82525] text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Ver Pacotes de Viagem
          </Link>
        </div>
      </section>

      {/* Photo Gallery Modal */}
      {selectedBus && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeGallery}
        >
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-4 text-white hover:text-gray-300 transition z-10"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <div 
            className="relative w-full max-w-4xl h-[70vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedBus.photos[currentPhotoIndex]}
              alt={`${selectedBus.model} - Foto ${currentPhotoIndex + 1}`}
              fill
              className="object-contain"
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full">
              {currentPhotoIndex + 1} / {selectedBus.photos.length}
            </div>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-4 text-white hover:text-gray-300 transition z-10"
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}

      {/* Bottom Navigation - igual à tela inicial */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-20 items-center justify-around border-t border-[#e0e0e0]/50 dark:border-white/10 bg-[#F5F5F7] dark:bg-[#101622] shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <Link href="/" className="flex flex-col items-center gap-1 text-[#4F4F4F] dark:text-[#E0E0E0] hover:text-[#1A2E40] dark:hover:text-white transition-colors">
          <HomeIcon className="w-6 h-6" />
          <p className="text-xs font-medium">Início</p>
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
  )
}
