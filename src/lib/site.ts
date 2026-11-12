import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE_TITLE = 'HypeProxies Docs';
export const SITE_DESCRIPTION =
  'Guides for your HypeProxies services. How to connect, how to use them and how to fix common problems.';

/**
 * Mac mini, bare metal and VPS customers sign in to the WHMCS client area (dash.hypeproxies.com)
 * until their services move to the new dashboard; the reseller API lives in the new dashboard.
 */
export const links = {
  website: 'https://hypeproxies.com',
  helpCenter: 'https://hypeproxies.com/help-center',
  login: 'https://dash.hypeproxies.com/index.php?rp=/login',
  ticket: 'https://dash.hypeproxies.com/submitticket.php',
  discord: 'https://discord.gg/DfjCzna',
  contact: 'https://hypeproxies.com/contact',
  terms: 'https://hypeproxies.com/terms-of-service',
  privacy: 'https://hypeproxies.com/privacy-policy',
  acceptableUse: 'https://hypeproxies.com/acceptable-use-policy',
  resellerDashboard: 'https://app.hypeproxies.com/reseller',
  apiKeys: 'https://app.hypeproxies.com/api-keys',
} as const;

export const RESELLER_API_PATH = '/api/reseller/';

export type Service = CollectionEntry<'services'>;
export type Guide = CollectionEntry<'guides'>;
export type ServiceWithGuides = { service: Service; guides: Guide[] };

/** A guide's id is `<service>/<name>`; its page is `/<service>/<name>.html`, as on the Jekyll site. */
export const guideUrl = (guide: Guide) => `/${guide.id}.html`;
export const serviceUrl = (service: Service) => `/${service.id}/`;
export const guideService = (guide: Guide) => guide.id.split('/')[0];

/** Every service, each with its guides; both sorted by their `order`. */
export async function servicesWithGuides(): Promise<ServiceWithGuides[]> {
  const [services, guides] = await Promise.all([getCollection('services'), getCollection('guides')]);
  const ids = new Set(services.map((s) => s.id));
  const orphan = guides.find((g) => !ids.has(guideService(g)));
  if (orphan) {
    throw new Error(`guides/${orphan.id}.md is in a folder that is not listed in guides/services.yml`);
  }
  return services.sort((a, b) => a.data.order - b.data.order).map((service) => ({
    service,
    guides: guides
      .filter((g) => guideService(g) === service.id)
      .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title)),
  }));
}

/** 'Nov 4, 2026', the date format of the design system. */
export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Plain text of rendered HTML, for search and meta descriptions. */
export const htmlToText = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity) => decodeEntity(entity))
    .replace(/\s+/g, ' ')
    .trim();

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeEntity(entity: string) {
  const body = entity.slice(1, -1);
  if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(parseInt(body.slice(2), 16));
  if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
  return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
}
