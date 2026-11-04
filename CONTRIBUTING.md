# Adding and editing docs

[docs.hypeproxies.com](https://docs.hypeproxies.com) is built by GitHub Pages from the `main` branch: a push to `main` is live in about a minute. The design (header, sidebar, search, "On this page", footer) comes from the theme, so you only write Markdown.

## Where things are

| Path | What it is |
|---|---|
| `_data/categories.yml` | The list of services: sidebar, home page and footer |
| `mac-mini/`, `bare-metal/`, `vps/`, `proxy/` | One folder per service: an `index.md` (the service page) plus one file per guide |
| `templates/guide-template.md` | Starting point for a new guide (not published) |
| `_layouts/`, `_includes/`, `assets/` | The design. No need to touch them to add content |

## Add a guide

1. Copy `templates/guide-template.md` into the service folder. Name it in lowercase with hyphens: `vps/connecting.md`, `proxy/browser-setup.md`.
2. Fill in the front matter at the top of the file:

   ```yaml
   ---
   title: Connecting to your VPS        # page title, sidebar, cards, search
   description: One or two sentences.   # shown under the title and on the cards
   order: 1                             # position in the sidebar, lowest first
   last_updated: 2026-11-04             # change it every time the guide changes
   ---
   ```

3. Write the guide below it with `##` sections and `###` subsections. Do not add a `#` title: the page already shows `title`. "On this page" is built from the `##` and `###` headings.
4. Push to `main` (or open a pull request). The guide shows up by itself in the sidebar, on the home page, on the service page and in search. The service's "Coming soon" label disappears with its first guide.

## Add a service

1. Add it to `_data/categories.yml` (`id`, `title`, `description`, `icon`).
2. Create a folder named like the `id`, with an `index.md` that contains only:

   ```yaml
   ---
   layout: category
   ---
   ```

   The service is shown as "Coming soon" until its first guide is added.

## How to write

- Write for the customer: what to click, what to type, what they should see. One action per step.
- Use placeholders that cannot hit a real system: address `203.0.113.10` (documentation range), username `client12345`, domain `example.com`.
- Never put real IP addresses, usernames, passwords, internal hostnames or management systems in a guide.
- Commands go in fenced code blocks with a language (` ```bash `); readers get a Copy button. Menu paths go in bold: **Go > Connect to Server**.
- Link to another guide by its file: `[Connecting to your Mac mini](../mac-mini/connecting.md)`. Link to a section with `#` and the heading in lowercase with hyphens: `#kvm-console-free`.
- Images go in an `images/` folder next to the guide: `![Client area](images/client-area.png)`.
- Note box: start a paragraph with `> **Note:**`. For a warning box, put `{: .warning}` on the line right after it.
- HTML comments (`<!-- TODO: ... -->`) are not displayed, but anyone can read them in the page source and in this public repo. Never put secrets or internal details in them.

## Preview on your computer (optional)

Needs Ruby 3.x (the GitHub Pages gems do not support Ruby 4 yet):

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.
