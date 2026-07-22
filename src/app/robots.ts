import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/checkout/sukces'],
    },
    sitemap: 'https://solospot.pl/sitemap.xml',
  };
}
