'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PublicLayout } from '@/components/layout';
import { useSiteConfig } from '@/hooks/use-site-config';
import {
  Send,
  MessageCircle,
  Bus,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Building2,
  GraduationCap,
  Heart,
  Church,
  Briefcase,
  Plane,
  CheckCircle2,
} from 'lucide-react';

const eventTypes = [
  'Corporativo',
  'Casamento',
  'Religioso',
  'Formatura',
  'Escolar',
  'Excursão',
  'Outro',
] as const;

const highlights = [
  { icon: Building2, label: 'Corporativo', desc: 'Eventos e transporte de funcionários' },
  { icon: Heart, label: 'Casamentos', desc: 'Translado para os convidados' },
  { icon: Church, label: 'Religiosos', desc: 'Excursões para grupos de fé' },
  { icon: GraduationCap, label: 'Formaturas', desc: 'Viagens de turma com conforto' },
  { icon: Briefcase, label: 'Escolas', desc: 'Passeios e eventos escolares' },
  { icon: Plane, label: 'Excursões', desc: 'Viagens em grupo para qualquer destino' },
];

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatDateBr(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export default function FretamentoPage() {
  const siteConfig = useSiteConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengersCount: '',
    eventType: '',
    message: '',
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = field === 'phone' ? formatPhone(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const whatsappMessage = useMemo(() => {
    const lines = [
      '🚌 *SOLICITAÇÃO DE FRETAMENTO - AMORIM TURISMO*',
      '',
      `👤 *Nome:* ${form.name || '(a preencher)'}`,
      form.phone ? `📞 *Telefone:* ${form.phone}` : null,
      form.email ? `✉️ *E-mail:* ${form.email}` : null,
      '',
      '📍 *DETALHES DA VIAGEM*',
      `Origem: ${form.origin || '(a preencher)'}`,
      `Destino: ${form.destination || '(a preencher)'}`,
      `Data de ida: ${form.departureDate ? formatDateBr(form.departureDate) : '(a preencher)'}`,
      form.returnDate ? `Data de volta: ${formatDateBr(form.returnDate)}` : null,
      form.passengersCount ? `Passageiros: ${form.passengersCount}` : null,
      form.eventType ? `Tipo de evento: ${form.eventType}` : null,
      '',
      form.message ? `📝 *Observações:*\n${form.message}` : null,
    ];
    return lines.filter(Boolean).join('\n');
  }, [form]);

  const handleWhatsApp = () => {
    const url = `https://wa.me/${siteConfig.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Preencha nome, e-mail e telefone');
      return;
    }
    if (!form.origin.trim() || !form.destination.trim()) {
      toast.error('Informe origem e destino');
      return;
    }
    if (!form.departureDate) {
      toast.error('Informe a data de ida');
      return;
    }
    const passengers = parseInt(form.passengersCount, 10);
    if (Number.isNaN(passengers) || passengers < 1) {
      toast.error('Informe a quantidade de passageiros');
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error('Mensagem deve ter pelo menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'charter',
          name: form.name,
          email: form.email,
          phone: form.phone.replace(/\D/g, ''),
          subject: 'Fretamento de ônibus',
          message: form.message,
          origin: form.origin,
          destination: form.destination,
          departureDate: form.departureDate,
          returnDate: form.returnDate || undefined,
          passengersCount: passengers,
          eventType: form.eventType || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar solicitação');
        return;
      }

      toast.success('Solicitação enviada! Entraremos em contato em breve.');
      setForm({
        name: '',
        email: '',
        phone: '',
        origin: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        passengersCount: '',
        eventType: '',
        message: '',
      });
    } catch (error) {
      console.error('Erro ao enviar fretamento:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
              <Bus className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Fretamento de Ônibus</h1>
            <p className="text-lg text-muted-foreground">
              Locação de ônibus para viagens, eventos, empresas, escolas, casamentos e muito mais.
              Receba uma cotação personalizada em minutos.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/${siteConfig.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
              <a
                href="#form"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
                Solicitar Cotação
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tipos de fretamento */}
      <section className="py-12">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Para qualquer ocasião</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {highlights.map((h, idx) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <h.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm">{h.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="form" className="py-12">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5"
            >
              <div>
                <h2 className="text-2xl font-bold">Solicite sua cotação</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha os dados abaixo e nossa equipe enviará uma proposta sob medida.
                </p>
              </div>

              {/* Dados de contato */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Seu nome"
                    required
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="(31) 99999-9999"
                    required
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Detalhes da viagem */}
              <div className="border-t border-border pt-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Detalhes da viagem
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Origem *
                    </label>
                    <input
                      type="text"
                      value={form.origin}
                      onChange={update('origin')}
                      placeholder="Cidade de saída"
                      required
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Destino *
                    </label>
                    <input
                      type="text"
                      value={form.destination}
                      onChange={update('destination')}
                      placeholder="Cidade ou local de destino"
                      required
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Data de ida *
                    </label>
                    <input
                      type="date"
                      value={form.departureDate}
                      onChange={update('departureDate')}
                      min={new Date().toISOString().slice(0, 10)}
                      required
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Data de volta
                    </label>
                    <input
                      type="date"
                      value={form.returnDate}
                      onChange={update('returnDate')}
                      min={form.departureDate || new Date().toISOString().slice(0, 10)}
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Qtd. de passageiros *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.passengersCount}
                      onChange={update('passengersCount')}
                      placeholder="Ex: 30"
                      required
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Tipo de evento
                    </label>
                    <select
                      value={form.eventType}
                      onChange={update('eventType')}
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                    >
                      <option value="">Selecione...</option>
                      {eventTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Observações *
                </label>
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Conte-nos mais sobre sua viagem: paradas, horários, requisitos especiais..."
                  rows={4}
                  required
                  minLength={10}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar solicitação
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-bold transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar pelo WhatsApp
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Ao enviar pelo WhatsApp, abrimos uma conversa com os dados já preenchidos.
              </p>
            </motion.form>

            {/* Info Side */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Por que escolher a Amorim?</h3>
                <ul className="space-y-3 text-sm">
                  {[
                    'Frota moderna, revisada e segura',
                    'Motoristas experientes e treinados',
                    'Atendimento personalizado e ágil',
                    'Cotação rápida via WhatsApp',
                    'Cobertura para todo o Brasil',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2">Atendimento direto</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Prefere falar com nossa equipe agora? Entre em contato pelos canais abaixo.
                </p>
                <div className="space-y-2 text-sm">
                  <a
                    href={`https://wa.me/${siteConfig.whatsapp_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:underline font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {siteConfig.phone_primary}
                  </a>
                  {siteConfig.email && (
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Send className="w-4 h-4" />
                      {siteConfig.email}
                    </a>
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
