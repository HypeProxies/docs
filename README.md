# HypeProxies customer docs

Source of [docs.hypeproxies.com](https://docs.hypeproxies.com): guides for customers of our hosted services (how to connect, how to use the service, how to fix common problems) and the public reseller API reference.

The site is built with [Astro](https://astro.build) and published to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. Its look follows the HypeProxies dashboard design system: `src/styles/tokens.css` is a verbatim copy of the dashboard's `docs/design-system/tokens/c6/tokens.css`, and every color, size, space, radius, shadow and motion on the site is one of those tokens. This README and `CONTRIBUTING.md` are not published.

**Adding or changing a guide?** See [CONTRIBUTING.md](CONTRIBUTING.md) and start from [templates/guide-template.md](templates/guide-template.md).
