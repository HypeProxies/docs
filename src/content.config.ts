import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';

/** guides/services.yml: the services shown on the site. */
const services = defineCollection({
  loader: file('guides/services.yml'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.enum(['mac', 'server', 'cloud', 'globe']),
    order: z.number(),
  }),
});

/** guides/<service>/<name>.md: one guide, published at /<service>/<name>.html. */
const guides = defineCollection({
  loader: glob({ pattern: '*/*.md', base: 'guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(100),
    last_updated: z.coerce.date(),
  }),
});

export const collections = { services, guides };
