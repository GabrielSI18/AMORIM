import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Prisma precisa ficar fora do bundle do webpack para o OpenNext resolver o engine WASM no Workers
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  // Garante que a build WASM do Prisma vá junto para o bundle do Worker
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/.prisma/client/wasm*',
      './node_modules/.prisma/client/query_engine_bg.*',
      './node_modules/@prisma/client/wasm*',
      './node_modules/@prisma/client/runtime/wasm-engine-edge.*',
    ],
  },
  async redirects() {
    return [
      {
        // www na raiz: regra própria, porque no OpenNext o '/:path*' com caminho
        // vazio redireciona para o literal "/:path*" (404)
        source: '/',
        has: [{ type: 'host', value: 'www.amorimturismo.com.br' }],
        destination: 'https://amorimturismo.com.br/',
        permanent: true,
      },
      {
        // www -> domínio sem www
        source: '/:path*',
        has: [{ type: 'host', value: 'www.amorimturismo.com.br' }],
        destination: 'https://amorimturismo.com.br/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
  images: {
    // O otimizador (/_next/image) não funciona neste deploy (Workers): ele
    // devolve 404 para imagens servidas por rota de API, que é o caso das
    // fotos no R2. Como os arquivos já são gerados no tamanho certo, servimos
    // direto — assim nenhuma página depende dele.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

export default nextConfig;
