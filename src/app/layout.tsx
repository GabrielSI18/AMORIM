import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from 'sonner';
import { baseMetadata, getOrganizationSchema, getWebsiteSchema, JsonLd } from '@/lib/seo';
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = baseMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verificar se Clerk está configurado
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = clerkKey && clerkKey.startsWith('pk_');

  if (!hasClerk) {
    // Renderizar sem Clerk se não configurado
    return (
      <html lang="pt-BR">
        <head>
          <JsonLd data={getOrganizationSchema()} />
          <JsonLd data={getWebsiteSchema()} />
        </head>
        <body
          className={`${plusJakartaSans.variable} font-sans antialiased`}
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <head>
          <JsonLd data={getOrganizationSchema()} />
          <JsonLd data={getWebsiteSchema()} />
        </head>
        <body
          className={`${plusJakartaSans.variable} font-sans antialiased`}
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
