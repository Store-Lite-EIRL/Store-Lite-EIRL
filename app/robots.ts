import { env } from '@/config/env';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.nextPublicAppUrl;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/list-business/',
        '/*/dashboard/',
        '/*/storage/',
        '/*/settings/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
