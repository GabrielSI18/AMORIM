'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Bus, Minus, Plus, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BusSeatMap, BusInfo } from '@/components/packages/bus-seat-map';
import { getAffiliateCode, clearAffiliateCode } from '@/hooks/use-affiliate-tracking';
import type { Package } from '@/types';

interface ReservaPageProps {
  params: Promise<{
    packageId: string;
  }>;
}

export default function ReservaPage({ params }: ReservaPageProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [packageId, setPackageId] = useState<string>('');
  const [pkg, setPkg] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [numPassengers, setNumPassengers] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  
  // Seats state
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

  useEffect(() => {
    params.then(p => setPackageId(p.packageId));
  }, [params]);

  useEffect(() => {
    if (packageId) {
      loadPackage();
    }
  }, [packageId]);

  // Preencher dados do usuário logado
  useEffect(() => {
    if (isLoaded && user) {
      setCustomerName(user.fullName || '');
      setCustomerEmail(user.primaryEmailAddress?.emailAddress || '');
      setCustomerPhone(user.primaryPhoneNumber?.phoneNumber || '');
    }
  }, [isLoaded, user]);

  // Carregar assentos ocupados e dados do ônibus
  const loadOccupiedSeats = useCallback(async () => {
    if (!packageId) return;
    
    setLoadingSeats(true);
    try {
      const response = await fetch(`/api/packages/${packageId}/seats`);
      if (response.ok) {
        const data = await response.json();
        setOccupiedSeats(data.occupiedSeats || []);
        if (data.bus) {
          setBusInfo(data.bus);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar assentos:', error);
    } finally {
      setLoadingSeats(false);
    }
  }, [packageId]);

  // Carregar assentos quando pacote carregar
  useEffect(() => {
    if (pkg?.totalSeats && pkg.totalSeats > 0) {
      loadOccupiedSeats();
    }
  }, [pkg?.totalSeats, loadOccupiedSeats]);

  // Atualizar número de passageiros quando seleção de assentos mudar
  useEffect(() => {
    if (selectedSeats.length > 0) {
      setNumPassengers(selectedSeats.length);
    }
  }, [selectedSeats]);

  const handleSeatSelectionChange = (seats: number[]) => {
    setSelectedSeats(seats);
  };

  const loadPackage = async () => {
    try {
      const response = await fetch(`/api/packages/${packageId}`);
      if (!response.ok) throw new Error('Pacote não encontrado');
      const data = await response.json();
      setPkg(data.data);
    } catch (error) {
      console.error('Erro ao carregar pacote:', error);
      toast.error('Pacote não encontrado');
      router.push('/pacotes');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatadores
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Formatar valor em centavos para reais
  const formatCurrency = (valueInCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'A definir';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pkg) return;

    // Validações
    if (!customerName.trim()) {
      toast.error('Informe seu nome completo');
      return;
    }
    if (!customerEmail.trim()) {
      toast.error('Informe seu e-mail');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Informe seu telefone');
      return;
    }
    
    // Validar seleção de assentos se o pacote tem assentos
    if (pkg.totalSeats && pkg.totalSeats > 0 && selectedSeats.length === 0) {
      toast.error('Selecione os assentos desejados no mapa do ônibus');
      return;
    }

    setIsSubmitting(true);

    try {
      // Obter código de afiliado salvo (se houver)
      const affiliateCode = getAffiliateCode();
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone.replace(/\D/g, ''),
          customer_cpf: customerCpf.replace(/\D/g, ''),
          num_passengers: numPassengers,
          customer_notes: customerNotes,
          selected_seats: selectedSeats.length > 0 ? selectedSeats : null,
          affiliate_code: affiliateCode, // Código do afiliado
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar reserva');
      }

      // Limpar código de afiliado após reserva bem sucedida
      if (affiliateCode) {
        clearAffiliateCode();
      }

      toast.success('Reserva criada com sucesso!');
      router.push(`/reserva/${packageId}/confirmacao?bookingId=${data.data.id}`);
    } catch (error: any) {
      console.error('Erro ao criar reserva:', error);
      toast.error(error.message || 'Erro ao criar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = pkg ? pkg.price * numPassengers : 0;
  const availableSeats = pkg?.availableSeats ?? pkg?.totalSeats ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#004a80]" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212] flex flex-col items-center justify-center gap-4">
        <p className="text-[#4F4F4F] dark:text-[#adb5bd]">Pacote não encontrado</p>
        <Link href="/pacotes" className="text-[#004a80] hover:underline">
          Voltar para pacotes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A2E40] dark:text-white" />
            </button>
            <h1 className="text-xl font-bold text-[#1A2E40] dark:text-white">Reservar Pacote</h1>
          </div>
        </div>
      </header>

      <main className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quantidade de Passageiros */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-[#1A2E40] dark:text-white mb-4">
                  Quantidade de Passageiros
                </h2>
                
                {/* Se tem mapa de assentos, mostrar informação */}
                {pkg.totalSeats && pkg.totalSeats > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-lg font-bold text-primary">
                        {selectedSeats.length > 0 ? selectedSeats.length : 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        assento(s) selecionado(s)
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Selecione os assentos no mapa abaixo
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setNumPassengers(Math.max(1, numPassengers - 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      disabled={numPassengers <= 1}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold text-[#1A2E40] dark:text-white w-12 text-center">
                      {numPassengers}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNumPassengers(Math.min(availableSeats, numPassengers + 1))}
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      disabled={numPassengers >= availableSeats}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-[#6c757d] dark:text-[#adb5bd]">
                      {availableSeats > 0 ? `${availableSeats} vagas disponíveis` : 'Verificar disponibilidade'}
                    </span>
                  </div>
                )}
              </div>

              {/* Mapa de Assentos do Ônibus */}
              {pkg.totalSeats && pkg.totalSeats > 0 && (
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-[#1A2E40] dark:text-white mb-4 flex items-center gap-2">
                    <Bus className="w-5 h-5" />
                    {busInfo ? `Nosso Veículo: ${busInfo.model}` : 'Escolha seus Assentos'}
                  </h2>
                  
                  {loadingSeats ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <BusSeatMap
                      totalSeats={pkg.totalSeats}
                      occupiedSeats={occupiedSeats}
                      selectedSeats={selectedSeats}
                      maxSelectable={Math.min(10, pkg.totalSeats - occupiedSeats.length)}
                      onSelectionChange={handleSeatSelectionChange}
                      readonly={false}
                      showLegend
                      bus={busInfo}
                    />
                  )}
                  
                  {selectedSeats.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-primary">Assentos selecionados:</strong>{' '}
                        {selectedSeats.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dados do Responsável */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-[#1A2E40] dark:text-white mb-4">
                  Dados do Responsável
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#4F4F4F] dark:text-[#adb5bd] mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-[#1A2E40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004a80] focus:border-transparent"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4F4F4F] dark:text-[#adb5bd] mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-[#1A2E40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004a80] focus:border-transparent"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4F4F4F] dark:text-[#adb5bd] mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-[#1A2E40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004a80] focus:border-transparent"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4F4F4F] dark:text-[#adb5bd] mb-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(formatCPF(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-[#1A2E40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004a80] focus:border-transparent"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#4F4F4F] dark:text-[#adb5bd] mb-1">
                      Observações
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-[#1A2E40] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#004a80] focus:border-transparent resize-none"
                      placeholder="Alguma informação adicional? (alergias, necessidades especiais, etc.)"
                    />
                  </div>
                </div>
              </div>

              {/* Botão Mobile */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#004a80] hover:bg-[#003a66] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirmar Reserva - {formatCurrency(totalPrice)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Resumo do Pedido - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Card do Pacote */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="relative h-40">
                  <Image
                    src={pkg.coverImage || pkg.galleryImages?.[0] || '/placeholder-package.jpg'}
                    alt={pkg.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[#1A2E40] dark:text-white mb-2">
                    {pkg.title}
                  </h3>
                  <div className="space-y-2 text-sm text-[#6c757d] dark:text-[#adb5bd]">
                    {(pkg.destination || (pkg as any).destinationRel) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {typeof pkg.destination === 'string' 
                            ? pkg.destination 
                            : (pkg.destination as any)?.name || (pkg as any).destinationRel?.name}
                        </span>
                      </div>
                    )}
                    {pkg.departureDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(String(pkg.departureDate))}</span>
                      </div>
                    )}
                    {pkg.durationDays && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{pkg.durationDays} dias</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo de Valores */}
              <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-[#1A2E40] dark:text-white mb-4">
                  Resumo do Pedido
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6c757d] dark:text-[#adb5bd]">
                      Pacote ({numPassengers}x)
                    </span>
                    <span className="text-[#1A2E40] dark:text-white">
                      {formatCurrency(pkg.price)} cada
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#1A2E40] dark:text-white">
                        Total
                      </span>
                      <span className="font-bold text-xl text-[#004a80] dark:text-[#3b82f6]">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  form="booking-form"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-4 py-4 bg-[#004a80] hover:bg-[#003a66] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirmar Reserva
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-[#6c757d] dark:text-[#adb5bd] mt-3">
                  Você receberá os dados para pagamento por e-mail
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
