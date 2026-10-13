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
