'use client';

interface PriceTableProps {
  price: number;
  priceChild610?: number | null;
  priceChild1113?: number | null;
  maxInstallments?: number;
}

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

export function PriceTable({
  price,
  priceChild610,
  priceChild1113,
  maxInstallments = 10,
}: PriceTableProps) {
  const hasChildPrices = (priceChild1113 && priceChild1113 > 0) || (priceChild610 && priceChild610 > 0);

  return (
    <div className="space-y-3">
      {/* Adulto */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
        <div>
          <p className="font-medium">Adulto</p>
          <p className="text-sm text-muted-foreground">Acima de 13 anos</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatPrice(price)}</p>
          {maxInstallments > 1 && (
            <p className="text-sm text-muted-foreground">
              ou {maxInstallments}x de {formatPrice(price / maxInstallments)}
            </p>
          )}
        </div>
      </div>

      {/* Crianças - Agrupado */}
      <div className="bg-secondary/50 rounded-xl border border-border overflow-hidden">
        {/* Criança 11-13 */}
        {priceChild1113 && priceChild1113 > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div>
              <p className="font-medium">Criança 11 a 13 anos</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{formatPrice(priceChild1113)}</p>
              {maxInstallments > 1 && (
                <p className="text-xs text-muted-foreground">
                  ou {maxInstallments}x de {formatPrice(priceChild1113 / maxInstallments)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Criança 6-10 */}
        {priceChild610 && priceChild610 > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div>
              <p className="font-medium">Criança 6 a 10 anos</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{formatPrice(priceChild610)}</p>
              {maxInstallments > 1 && (
                <p className="text-xs text-muted-foreground">
                  ou {maxInstallments}x de {formatPrice(priceChild610 / maxInstallments)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Criança 0-5 - Gratuito */}
        <div className="flex items-center justify-between p-4 bg-green-500/5">
          <div>
            <p className="font-medium text-green-700 dark:text-green-400">Criança 0 a 5 anos</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">Gratuito</p>
            <p className="text-xs text-green-600/80 dark:text-green-500/80">Não ocupa assento</p>
          </div>
        </div>
      </div>

      {/* Info de Pagamento */}
      {maxInstallments > 1 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            💳 Dividimos em até <span className="font-semibold text-foreground">{maxInstallments}x sem juros</span> no cartão
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PIX e boleto: parcelamos até o mês da viagem
          </p>
        </div>
      )}
    </div>
  );
}
