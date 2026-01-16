'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, MapPin, FileText, HelpCircle, Loader2, Bus, Users, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  type: 'package' | 'page' | 'faq'
  title: string
  description?: string
  url: string
  icon: React.ReactNode
}

// Páginas estáticas do site
const staticPages: SearchResult[] = [
  { type: 'page', title: 'Pacotes de Viagem', description: 'Veja todos os pacotes disponíveis', url: '/pacotes', icon: <MapPin className="w-4 h-4" /> },
  { type: 'page', title: 'Nossa Frota', description: 'Conheça nossos veículos', url: '/frota', icon: <Bus className="w-4 h-4" /> },
  { type: 'page', title: 'Seja um Afiliado', description: 'Ganhe dinheiro indicando viagens', url: '/afiliados', icon: <Users className="w-4 h-4" /> },
  { type: 'page', title: 'Sobre Nós', description: 'Conheça a Amorim Turismo', url: '/sobre', icon: <FileText className="w-4 h-4" /> },
  { type: 'page', title: 'Perguntas Frequentes', description: 'Dúvidas comuns respondidas', url: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
  { type: 'page', title: 'Contato', description: 'Entre em contato conosco', url: '/contato', icon: <Phone className="w-4 h-4" /> },
  { type: 'page', title: 'Termos de Uso', description: 'Termos e condições', url: '/termos', icon: <FileText className="w-4 h-4" /> },
  { type: 'page', title: 'Políticas de Privacidade', description: 'Como tratamos seus dados', url: '/politicas', icon: <FileText className="w-4 h-4" /> },
]

// FAQs para busca
const faqItems: SearchResult[] = [
  { type: 'faq', title: 'Como faço para reservar um pacote?', description: 'Acesse a página de pacotes e clique em Reservar', url: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
  { type: 'faq', title: 'Quais formas de pagamento são aceitas?', description: 'Cartão, PIX e boleto bancário', url: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
  { type: 'faq', title: 'Posso cancelar minha reserva?', description: 'Sim, consulte nossas políticas', url: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
  { type: 'faq', title: 'Posso parcelar minha viagem?', description: 'Até 12x sem juros no cartão', url: '/faq', icon: <HelpCircle className="w-4 h-4" /> },
  { type: 'faq', title: 'Como me tornar um afiliado?', description: 'Cadastre-se na página de afiliados', url: '/afiliados', icon: <HelpCircle className="w-4 h-4" /> },
]

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [packages, setPackages] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Buscar pacotes da API
  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch('/api/packages?status=PUBLISHED&limit=50')
      if (response.ok) {
        const data = await response.json()
        const packageResults: SearchResult[] = data.data?.map((pkg: any) => ({
          type: 'package' as const,
          title: pkg.title,
          description: pkg.destination?.name || pkg.description?.slice(0, 60),
          url: `/pacotes/${pkg.slug}`,
          icon: <MapPin className="w-4 h-4" />,
        })) || []
        setPackages(packageResults)
      }
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error)
    }
  }, [])

  // Carregar pacotes ao abrir
  useEffect(() => {
    if (isOpen) {
      fetchPackages()
      inputRef.current?.focus()
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen, fetchPackages])

  // Filtrar resultados com base na query
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    const searchTerm = query.toLowerCase()

    // Filtrar pacotes
    const filteredPackages = packages.filter(
      pkg => pkg.title.toLowerCase().includes(searchTerm) || 
             pkg.description?.toLowerCase().includes(searchTerm)
    )

    // Filtrar páginas
    const filteredPages = staticPages.filter(
      page => page.title.toLowerCase().includes(searchTerm) || 
              page.description?.toLowerCase().includes(searchTerm)
    )

    // Filtrar FAQs
    const filteredFaqs = faqItems.filter(
      faq => faq.title.toLowerCase().includes(searchTerm) || 
             faq.description?.toLowerCase().includes(searchTerm)
    )

    // Combinar resultados (pacotes primeiro, depois páginas, depois FAQs)
    const combined = [...filteredPackages.slice(0, 5), ...filteredPages.slice(0, 3), ...filteredFaqs.slice(0, 3)]
    setResults(combined)
    setSelectedIndex(0)
    setIsLoading(false)
  }, [query, packages])

  // Navegação com teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    onClose()
  }

  // Fechar ao clicar fora
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-[#6c757d]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar pacotes, páginas, dúvidas..."
                className="flex-1 bg-transparent text-[#212529] dark:text-white placeholder-[#6c757d] text-lg outline-none"
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-4 h-4 text-[#6c757d]" />
                </button>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1 text-sm text-[#6c757d] bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#004a80]" />
                </div>
              ) : query && results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[#6c757d]">Nenhum resultado encontrado para &ldquo;{query}&rdquo;</p>
                  <p className="text-sm text-[#adb5bd] mt-1">Tente buscar por outro termo</p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.url}-${index}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left transition ${
                        index === selectedIndex
                          ? 'bg-[#004a80]/10 dark:bg-[#004a80]/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        result.type === 'package' 
                          ? 'bg-[#004a80]/10 text-[#004a80]' 
                          : result.type === 'faq'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-[#6c757d]'
                      }`}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#212529] dark:text-white truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-sm text-[#6c757d] truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.type === 'package'
                          ? 'bg-[#004a80]/10 text-[#004a80]'
                          : result.type === 'faq'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-[#6c757d]'
                      }`}>
                        {result.type === 'package' ? 'Pacote' : result.type === 'faq' ? 'FAQ' : 'Página'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4">
                  <p className="text-sm text-[#6c757d] mb-4">Sugestões de busca:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Rio de Janeiro', 'Gramado', 'Aparecida', 'Pacotes', 'Afiliado', 'Cancelamento'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-[#6c757d] rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-[#6c757d]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
                  para navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd>
                  para selecionar
                </span>
              </div>
              <span>Powered by Amorim Turismo</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
