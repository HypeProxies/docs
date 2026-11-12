# Adding and editing docs

[docs.hypeproxies.com](https://docs.hypeproxies.com) is built from the `main` branch by a GitHub Actions workflow (`.github/workflows/deploy.yml`): a push to `main` is live in about two minutes. The design (menu, search, "On this page", theme switch, footer) comes from the site, so you only write Markdown.

## Where things are

| Path | What it is |
|---|---|
| `guides/services.yml` | The list of services: menu, home page, service pages and search |
| `guides/mac-mini/`, `guides/bare-metal/`, `guides/vps/`, `guides/proxy/` | One folder per service, one Markdown file per guide |
| `templates/guide-template.md` | Starting point for a new guide (not published) |
| `src/data/reseller-openapi.json` | The reseller API reference, copied from the dashboard (see below) |
| `src/`, `public/`, `astro.config.mjs` | The site itself. No need to touch them to add content |

A guide at `guides/vps/connecting.md` is published at `https://docs.hypeproxies.com/vps/connecting.html`, and the service page at `https://docs.hypeproxies.com/vps/`.

## Add a guide

1. Copy `templates/guide-template.md` into the service folder. Name it in lowercase with hyphens: `guides/vps/connecting.md`, `guides/proxy/browser-setup.md`.
2. Fill in the front matter at the top of the file:

   ```yaml
   ---
   title: Connecting to your VPS        # page title, menu, cards, search
   description: One or two sentences.   # shown under the title and on the cards
   order: 1                             # position in the menu, lowest first
   last_updated: 2026-11-04             # change it every time the guide changes
   ---
   ```

3. Write the guide below it with `##` sections and `###` subsections. Do not add a `#` title: the page already shows `title`. "On this page" is built from the `##` and `###` headings.
4. Push to `main` (or open a pull request). The guide shows up by itself in the menu, on the home page, on the service page and in search. The service's "Coming soon" label disappears with its first guide.

A pull request builds the site too, so a broken guide (missing `title`, a date that is not a date) shows as a failed check before it reaches `main`.

## Add a service

Add it to `guides/services.yml` (`id`, `title`, `description`, `icon`, `order`) and create the folder `guides/<id>/`. The service is shown as "Coming soon" until its first guide is added.

## How to write

- Write for the customer: what to click, what to type, what they should see. One action per step.
- Use placeholders that cannot hit a real system: address `203.0.113.10` (documentation range), username `client12345`, domain `example.com`.
- Never put real IP addresses, usernames, passwords, internal hostnames or management systems in a guide.
- Commands go in fenced code blocks with a language (` ```bash `); readers get a Copy button. Menu paths go in bold: **Go > Connect to Server**.
- Link to another guide by its file: `[Connecting to your Mac mini](../mac-mini/connecting.md)`. Link to a section with `#` and the heading in lowercase with hyphens: `#kvm-console-free`.
- Images go in an `images/` folder next to the guide: `![Client area](images/client-area.png)`.
- Note box: start a paragraph with `> **Note:**`. Warning box: start it with `> **Warning:**`.
- HTML comments (`<!-- TODO: ... -->`) are not displayed, but anyone can read them in the page source and in this public repo. Never put secrets or internal details in them.

## Reseller API reference

`/api/reseller/` is rendered from `src/data/reseller-openapi.json`, a copy of the spec the dashboard exports (`docs/api/reseller-openapi.json` in the `hypeproxies_dashboard` repo). Run `scripts/sync-reseller-spec.sh` and commit the result whenever the reseller API changes on the dashboard's `staging` branch; pass a branch name to take it from elsewhere (`scripts/sync-reseller-spec.sh feat/my-branch`). It needs the GitHub CLI (`gh`) signed in with access to the dashboard repo.

## Preview on your computer (optional)

Needs Node.js 24 or later:

```bash
npm ci
npm run dev
```

Then open <http://localhost:4321>. Changes to a guide show up as you save.

To check the finished site the way it is published, run `npm run build && npm run verify`. The check serves the built site, opens every page in light, dark and phone sizes, and writes screenshots and the results to `.verify/` (first time only: `npx playwright install chromium`).
