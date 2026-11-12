/**
 * The reseller API's OpenAPI document, copied from the dashboard repo by scripts/sync-reseller-spec.sh.
 * It is bundled at build time: the docs never fetch it from the dashboard.
 */
import spec from '../data/reseller-openapi.json';

type Operation = { summary?: string; description?: string };
type ResellerSpec = {
  info: { title: string; version: string; summary?: string; description?: string };
  paths: Record<string, Record<string, Operation | unknown>>;
};

export const resellerSpec = spec as ResellerSpec;

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

/** The intro plus every operation's summary, so site search finds the reference. */
export const resellerSearchText = [
  resellerSpec.info.description ?? '',
  ...Object.values(resellerSpec.paths).flatMap((item) =>
    Object.entries(item)
      .filter(([method]) => HTTP_METHODS.has(method))
      .map(([, op]) => (op as Operation).summary ?? ''),
  ),
]
  .join(' ')
  .replace(/[`*_#>|[\]()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
