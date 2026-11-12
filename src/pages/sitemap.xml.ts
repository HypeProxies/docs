import type { APIRoute } from 'astro';
import { guideUrl, RESELLER_API_PATH, servicesWithGuides, serviceUrl } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const services = await servicesWithGuides();
  const pages: { path: string; lastmod?: Date }[] = [
    { path: '/' },
    ...services.map(({ service }) => ({ path: serviceUrl(service) })),
    ...services.flatMap(({ guides }) => guides.map((g) => ({ path: guideUrl(g), lastmod: g.data.last_updated }))),
    { path: RESELLER_API_PATH },
  ];
  const urls = pages
    .map(({ path, lastmod }) => {
      const loc = `<loc>${new URL(path, site).href}</loc>`;
      return `<url>${loc}${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`;
    })
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
