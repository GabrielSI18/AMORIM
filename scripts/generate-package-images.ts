import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const prisma = new PrismaClient();

// Mapeamento de pacotes para queries de imagens do Unsplash
const imageQueries: Record<string, string> = {
  'fim-de-semana-em-buzios': 'buzios brazil beach',
  'cidades-historicas-de-minas': 'ouro preto colonial church',
  'aventura-serra-mantiqueira': 'monte verde mountains brazil',
  'rio-de-janeiro-completo': 'rio de janeiro christ redeemer',
  'sao-paulo-cultura-gastronomia': 'sao paulo skyline paulista',
  'romaria-aparecida': 'aparecida basilica sanctuary',
};

// URLs específicas do Unsplash (imagens fixas de alta qualidade)
const specificImages: Record<string, string> = {
  'fim-de-semana-em-buzios': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop',
  'cidades-historicas-de-minas': 'https://images.unsplash.com/photo-1610894372644-faa776c4c81c?w=1200&h=800&fit=crop',
  'aventura-serra-mantiqueira': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  'rio-de-janeiro-completo': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&h=800&fit=crop',
  'sao-paulo-cultura-gastronomia': 'https://images.unsplash.com/photo-1548963670-aaaa8f73a5e9?w=1200&h=800&fit=crop',
  'romaria-aparecida': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop',
};

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function fetchUnsplashImage(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    console.warn('⚠️  UNSPLASH_ACCESS_KEY não configurada, usando placeholder');
    // Usar placeholder do Unsplash (não precisa de API key)
    const encodedQuery = encodeURIComponent(query);
    return `https://source.unsplash.com/1200x800/?${encodedQuery}`;
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.error(`Erro na API Unsplash: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return null;
  }
}

async function main() {
  console.log('🎨 Gerando imagens para os pacotes turísticos...\n');

  // Criar diretório para imagens se não existir
  const imagesDir = path.join(process.cwd(), 'public', 'packages');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const packages = await prisma.package.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  console.log(`📦 Encontrados ${packages.length} pacotes\n`);

  for (const pkg of packages) {
    console.log(`🎨 Configurando imagem para: ${pkg.title}`);

    // Usar imagem específica do Unsplash (sempre a mesma, alta qualidade)
    const imageUrl = specificImages[pkg.slug] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop';
    
    await prisma.package.update({
      where: { id: pkg.id },
      data: {
        cover_image: imageUrl,
      },
    });

    console.log(`   ✅ Configurado: ${imageUrl.substring(0, 60)}...\n`);
  }

  console.log('🎉 Todas as imagens foram configuradas!');
  console.log('\n📝 Imagens do Unsplash (fotos profissionais específicas e fixas)');
  console.log('   Cada pacote tem uma foto real de alta qualidade que não muda');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
