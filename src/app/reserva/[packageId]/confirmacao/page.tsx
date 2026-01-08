'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  MessageCircle,
  Home,
  ArrowRight,
  Clock,
  Bus,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface BookingDetails {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numPassengers: number;
  totalAmount: number;
  selectedSeats?: number[];
  status: string;
  createdAt: string;
  package: {
    id: string;
    title: string;
    destination?: { name: string } | null;
    destinationRel?: { name: string } | null;
    departureDate?: string;
    departureTime?: string;
    departureLocation?: string;
    coverImage?: string;
    durationDays?: number;
  };
}

interface ConfirmacaoPageProps {
  params: Promise<{
    packageId: string;
  }>;
}

export default function ConfirmacaoPage({ params }: ConfirmacaoPageProps) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [packageId, setPackageId] = useState<string>('');

  useEffect(() => {
    params.then(p => setPackageId(p.packageId));
  }, [params]);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    } else {
      setIsLoading(false);
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`);
      if (response.ok) {
        const { data } = await response.json();
        // Encontrar a reserva específica
        const foundBooking = Array.isArray(data) 
          ? data.find((b: BookingDetails) => b.id === bookingId)
          : data;
        setBooking(foundBooking || null);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (valueInCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valueInCents / 100);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'A definir';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const copyBookingId = () => {
    if (bookingId) {
      navigator.clipboard.writeText(bookingId);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openWhatsApp = () => {
    const phone = '5531982544924';
    const message = `Olá! Acabei de fazer uma reserva no site.

📦 *Código da Reserva:* ${bookingId}
${booking ? `📍 *Pacote:* ${booking.package?.title}` : ''}

Gostaria de mais informações sobre os próximos passos.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const destinationName = booking?.package?.destination?.name || 
                          booking?.package?.destinationRel?.name || 
                          '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-900/20 dark:to-background">
      <div className="container-custom py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          {/* Animação de Sucesso */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Reserva Realizada com Sucesso! 🎉
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Obrigado por escolher a <span className="font-semibold text-primary">Amorim Turismo</span>!
            </p>
          </motion.div>

          {/* Card de Informações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6"
          >
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80 mb-1">Código da Reserva</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold">
                      {bookingId?.slice(0, 8).toUpperCase()}...
                    </code>
                    <button
                      onClick={copyBookingId}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      title="Copiar código completo"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80 mb-1">Status</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-100 rounded-full text-sm font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Aguardando Confirmação
                  </span>
                </div>
              </div>
            </div>

            {/* Detalhes do Pacote */}
            {booking && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-4">
                  {booking.package?.coverImage && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={booking.package.coverImage}
                        alt={booking.package.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                      {booking.package?.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {destinationName && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          {destinationName}
                        </p>
                      )}
                      {booking.package?.departureDate && (
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          {formatDate(booking.package.departureDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detalhes da Reserva */}
            <div className="p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Detalhes da Reserva
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Passageiros</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {booking?.numPassengers || '-'}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Total</p>
                  <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                    {booking ? formatCurrency(booking.totalAmount) : '-'}
                  </p>
                </div>
              </div>

              {booking?.selectedSeats && booking.selectedSeats.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assentos Reservados</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bus className="w-4 h-4 text-primary" />
                    {booking.selectedSeats.sort((a, b) => a - b).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Próximos Passos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6"
          >
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximos Passos
            </h4>
            <ol className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Nossa equipe entrará em contato em até <strong>24 horas</strong> para confirmar sua reserva.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Você receberá as instruções de <strong>pagamento via PIX ou cartão</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Após confirmação do pagamento, seus <strong>assentos serão garantidos</strong>!</span>
              </li>
            </ol>
          </motion.div>

          {/* Contato Rápido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8"
          >
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
              Quer agilizar? Fale conosco agora! 💬
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
              Clique no botão abaixo para enviar uma mensagem no WhatsApp e confirmar sua reserva mais rapidamente.
            </p>
            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </button>
          </motion.div>

          {/* Botões de Navegação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
            >
              <Home className="w-5 h-5" />
              Voltar ao Início
            </Link>
            <Link
              href="/pacotes"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors"
            >
              Ver Mais Pacotes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Informações de Contato */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <p className="mb-2">Dúvidas? Entre em contato:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:+5531999732079" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                (31) 99973-2079
              </a>
              <a href="mailto:contato@amorimturismo.com.br" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                contato@amorimturismo.com.br
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
