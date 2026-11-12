import type { APIRoute } from 'astro';
import { resellerSearchText, resellerSpec } from '../lib/reseller-spec';
import { guideUrl, htmlToText, RESELLER_API_PATH, servicesWithGuides } from '../lib/site';

/** The search index read by src/scripts/search.ts. */
export const GET: APIRoute = async () => {
  const guides = (await servicesWithGuides()).flatMap(({ service, guides }) =>
    guides.map((guide) => ({
      title: guide.data.title,
      section: service.data.title,
      url: guideUrl(guide),
      description: guide.data.description,
      content: htmlToText(guide.rendered?.html ?? ''),
    })),
  );
  const reseller = {
    title: 'Reseller API reference',
    section: 'Developers',
    url: RESELLER_API_PATH,
    description: resellerSpec.info.summary ?? resellerSpec.info.title,
    content: resellerSearchText,
  };
  return Response.json([...guides, reseller]);
};
