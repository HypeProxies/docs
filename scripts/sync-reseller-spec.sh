#!/usr/bin/env bash
# Copies the reseller API's OpenAPI document from the dashboard repo into this site.
#
#   scripts/sync-reseller-spec.sh            # from the dashboard's staging branch
#   scripts/sync-reseller-spec.sh <ref>      # from another branch, tag or commit
#
# Needs the GitHub CLI (gh), signed in with read access to HypeProxies/hypeproxies_dashboard.
set -euo pipefail

ref="${1:-staging}"
repo="HypeProxies/hypeproxies_dashboard"
src="docs/api/reseller-openapi.json"
dest="$(cd "$(dirname "$0")/.." && pwd)/src/data/reseller-openapi.json"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

gh api "repos/$repo/contents/$src?ref=$ref" -H 'Accept: application/vnd.github.raw' > "$tmp"
node -e '
  const spec = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  if (!spec.openapi || !spec.info || !spec.paths) throw new Error("not an OpenAPI document");
' "$tmp"
mv "$tmp" "$dest"
trap - EXIT
echo "Updated src/data/reseller-openapi.json from $repo@$ref ($src)."
