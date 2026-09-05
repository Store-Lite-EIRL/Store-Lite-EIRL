import { env } from '@/config/env';
import type { MetadataRoute } from 'next';

interface RobotsParams {
  params: Promise<{ slug: string }>;
}

export default async function robots({ params }: RobotsParams): Promise<MetadataRoute.Robots> {
  const { slug } = await params;
  const baseUrl = env.nextPublicAppUrl;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/${slug}/sitemap.xml`,
  };
}
