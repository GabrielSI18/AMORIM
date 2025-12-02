'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Copy, 
  CheckCircle2,
  ExternalLink,
  Calendar,
  BarChart3
} from 'lucide-react';

interface AffiliateData {
  id: string;
  code: string;
  name: string;
  email: string;
  commissionRate: number;
  totalSales: number;
  totalEarned: number;
  totalBookings: number;
  status: string;
  createdAt: string;
}

interface Referral {
  id: string;
  packageTitle: string;
  customerEmail: string;
  saleAmount: number;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
}

export function AffiliateStats({ affiliateId }: { affiliateId: string }) {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // TODO: Fetch real data from API
    // Dados mockados por enquanto
    setTimeout(() => {
      setAffiliate({
        id: affiliateId,
        code: 'AMORIM2025',
        name: 'João Silva',
        email: 'joao@example.com',
        commissionRate: 10,
        totalSales: 128000, // R$ 1.280,00
        totalEarned: 12800, // R$ 128,00
        totalBookings: 3,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      setReferrals([
        {
          id: '1',
          packageTitle: 'Fim de Semana em Búzios',
          customerEmail: 'cliente1@example.com',
          saleAmount: 45000,
          commissionAmount: 4500,
          commissionStatus: 'paid',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          packageTitle: 'Histórico em Ouro Preto',
          customerEmail: 'cliente2@example.com',
          saleAmount: 28000,
          commissionAmount: 2800,
          commissionStatus: 'approved',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          packageTitle: 'Friozinho em Monte Verde',
          customerEmail: 'cliente3@example.com',
          saleAmount: 55000,
          commissionAmount: 5500,
          commissionStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]);

      setIsLoading(false);
    }, 1000);
  }, [affiliateId]);

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}/pacotes?ref=${affiliate?.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      approved: { label: 'Aprovado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      paid: { label: 'Pago', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Afiliado não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard do Afiliado</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {affiliate.name}! Acompanhe suas vendas e comissões.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total de Vendas</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(affiliate.totalSales)}</div>
          <div className="text-xs text-muted-foreground">
            {affiliate.totalBookings} reservas realizadas
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Comissões Ganhas</span>
            <DollarSign className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold text-accent">{formatCurrency(affiliate.totalEarned)}</div>
          <div className="text-xs text-muted-foreground">
            {affiliate.commissionRate}% por venda
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Reservas</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-bold">{affiliate.totalBookings}</div>
          <div className="text-xs text-muted-foreground">
            Total de clientes
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold">2.8%</div>
          <div className="text-xs text-muted-foreground">
            Média do mercado: 2.1%
          </div>
        </motion.div>
      </div>

      {/* Affiliate Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Seu Link de Afiliado</h3>
            <p className="text-sm text-muted-foreground">
              Compartilhe este link para ganhar comissões
            </p>
          </div>
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-mono font-medium">
            {affiliate.code}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            readOnly
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pacotes?ref=${affiliate.code}`}
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm"
          />
          <button
            onClick={copyAffiliateLink}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar
              </>
            )}
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <a
            href={`/pacotes?ref=${affiliate.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver página de pacotes com seu link
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>

      {/* Recent Referrals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Vendas Recentes</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico das suas últimas comissões
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pacote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {referrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">
                    {referral.packageTitle}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {referral.customerEmail}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatCurrency(referral.saleAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-accent">
                    {formatCurrency(referral.commissionAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(referral.commissionStatus)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(referral.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {referrals.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma venda ainda</p>
            <p className="text-sm mt-1">Comece a divulgar seu link!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
