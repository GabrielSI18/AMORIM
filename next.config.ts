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
