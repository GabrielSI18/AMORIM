'use client';

/**
 * Página de Exemplo - Email
 *
 * Testa envio de emails via AWS SES
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type EmailType = 'welcome';

interface EmailTest {
  type: EmailType;
  label: string;
  description: string;
}

const EMAIL_TESTS: EmailTest[] = [
  {
    type: 'welcome',
    label: '👋 Welcome Email',
    description: 'Email de boas-vindas enviado ao criar conta',
  },
];

export default function EmailExamplesPage() {
  const [loading, setLoading] = useState<EmailType | null>(null);
  const [results, setResults] = useState<Record<EmailType, { success: boolean; message: string } | null>>({
    welcome: null,
  });

  const sendTestEmail = async (type: EmailType) => {
    setLoading(type);
    
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(prev => ({ ...prev, [type]: { success: true, message: data.message || 'Email enviado!' } }));
        toast.success(`Email "${type}" enviado com sucesso!`);
      } else {
        setResults(prev => ({ ...prev, [type]: { success: false, message: data.error || 'Erro desconhecido' } }));
        toast.error(data.error || 'Erro ao enviar email');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro de conexão';
      setResults(prev => ({ ...prev, [type]: { success: false, message } }));
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📧 Email Examples</h1>
        <p className="text-muted-foreground">
          Teste o envio de emails via AWS SES. Os emails serão enviados para o seu email do Clerk.
        </p>
      </div>

      {/* Status */}
      <div className="mb-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">⚙️ Configuração</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <code>ACTIVE_EMAIL=true</code> no .env.local</li>
          <li>• AWS SES configurado e verificado</li>
          <li>• Email remetente verificado no SES</li>
        </ul>
      </div>

      {/* Email Tests */}
      <div className="space-y-4">
        {EMAIL_TESTS.map((test) => (
          <div
            key={test.type}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-medium">{test.label}</h3>
              <p className="text-sm text-muted-foreground">{test.description}</p>
              {results[test.type] && (
                <p className={`text-sm mt-1 ${results[test.type]?.success ? 'text-green-600' : 'text-red-600'}`}>
                  {results[test.type]?.success ? '✅' : '❌'} {results[test.type]?.message}
                </p>
              )}
            </div>
            <Button
              onClick={() => sendTestEmail(test.type)}
              disabled={loading !== null}
              variant={results[test.type]?.success ? 'outline' : 'primary'}
            >
              {loading === test.type ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Enviando...
                </>
              ) : results[test.type]?.success ? (
                'Reenviar'
              ) : (
                'Enviar Teste'
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">👀 Preview de Templates</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Para visualizar os templates no navegador:
        </p>
        <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
          npx react-email dev
        </pre>
      </div>

      {/* Docs */}
      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">📚 Documentação</h2>
        <ul className="text-sm space-y-1">
          <li>• Templates: <code>src/lib/email-templates.tsx</code></li>
          <li>• Service: <code>src/lib/email.ts</code></li>
          <li>• Config: <code>INIT-BASE.md - Seção 10 (Email)</code></li>
        </ul>
      </div>
    </div>
  );
}
