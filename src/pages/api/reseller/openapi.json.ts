import type { APIRoute } from 'astro';
import { resellerSpec } from '../../../lib/reseller-spec';

/** The spec itself, for code generators and API tools. */
export const GET: APIRoute = () => Response.json(resellerSpec);
