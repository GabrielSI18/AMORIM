interface AttractionsListProps {
  attractions: string[];
}

export function AttractionsList({ attractions }: AttractionsListProps) {
  if (!attractions || attractions.length === 0) {
    return null;
  }

  return (
    <section className="bg-card rounded-xl p-6 shadow-card">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Atrações com Acesso Liberado
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attractions.map((attraction, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{attraction}</span>
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-sm text-muted-foreground">
        🎟️ O acesso a estas atrações está incluso no valor do pacote, sem custos adicionais.
      </p>
    </section>
  );
}
