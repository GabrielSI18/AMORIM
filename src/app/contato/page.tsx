'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PublicLayout } from '@/components/layout';
import { 
  Send, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar contato:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Telefone',
      value: '(31) 99973-2079',
      description: 'Seg a Sex, 9h às 18h',
      href: 'tel:+5531999732079',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '(31) 98886-2079',
      description: 'Resposta rápida!',
      href: 'https://wa.me/5531988862079',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Mail,
      title: 'E-mail',
      value: 'contato@amorimturismo.com.br',
      description: 'Respondemos em até 24h',
      href: 'mailto:contato@amorimturismo.com.br',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: MapPin,
      title: 'Endereço',
      value: 'Rua Manaus, 48 - Bairro Amazonas',
      description: 'Contagem - MG',
      href: 'https://maps.google.com/?q=Rua+Manaus+48+Amazonas+Contagem+MG',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  const subjects = [
    'Dúvidas sobre pacotes',
    'Informações de pagamento',
    'Programa de Afiliados',
    'Suporte técnico',
    'Parcerias comerciais',
    'Reclamações',
    'Outros',
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold">
              Entre em Contato
            </h1>
            <p className="text-lg text-muted-foreground">
              Estamos aqui para ajudar! Escolha a melhor forma de falar conosco 
              ou envie uma mensagem pelo formulário abaixo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((info, index) => (
              <motion.a
                key={info.title}
                href={info.href}
                target={info.href.startsWith('http') ? '_blank' : undefined}
                rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 ${info.bgColor} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <info.icon className={`w-6 h-6 ${info.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{info.title}</h3>
                <p className="text-foreground font-medium">{info.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">Envie sua mensagem</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
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
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(31) 99999-9999"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Assunto
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition"
                    >
                      <option value="">Selecione...</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Mensagem
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  🔒 Seus dados estão protegidos pela LGPD
                </p>
              </form>
            </motion.div>

            {/* Info Side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* Horário de Funcionamento */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Horário de Atendimento</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Segunda a Sexta</span>
                    <span className="font-medium">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Sábado</span>
                    <span className="font-medium">09:00 - 13:00</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Domingo e Feriados</span>
                    <span className="font-medium text-accent">Fechado</span>
                  </div>
                </div>
              </div>

              {/* FAQ Rápido */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6">Perguntas Frequentes</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Qual o prazo de resposta?</p>
                      <p className="text-sm text-muted-foreground">Respondemos em até 24 horas úteis.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Posso ligar fora do horário?</p>
                      <p className="text-sm text-muted-foreground">Envie WhatsApp que retornamos no próximo dia útil.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Atendimento presencial?</p>
                      <p className="text-sm text-muted-foreground">Sim! Agende pelo WhatsApp ou telefone.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapa Google */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.0521651287722!2d-44.04496622401354!3d-19.964308339379283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa6be3cea9a86b7%3A0xcdd1422d7c37b086!2sR.%20Manaus%2C%2048%20-%20Amazonas%2C%20Contagem%20-%20MG%2C%2032240-080%2C%20Brasil!5e0!3m2!1spt-BR!2sus!4v1767646321062!5m2!1spt-BR!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0, aspectRatio: '16/9' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização - R. Manaus, 48 - Amazonas, Contagem - MG"
                  className="w-full aspect-video"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
