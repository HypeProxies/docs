/** Search over /search.json (built with the site): titles weigh most, then text matches. */
import { setNav } from './nav';

type Entry = { title: string; section: string; url: string; description: string; content: string };
type Indexed = Entry & { titleLower: string; textLower: string };

const input = document.querySelector<HTMLInputElement>('#search-input');
const results = document.querySelector<HTMLElement>('#search-results');

if (input && results) {
  let index: Promise<Indexed[]> | null = null;
  let selected = -1;

  const load = () => {
    index ??= fetch('/search.json')
      .then((response) => response.json() as Promise<Entry[]>)
      .then((entries) =>
        entries.map((entry) => ({
          ...entry,
          titleLower: entry.title.toLowerCase(),
          textLower: `${entry.description} ${entry.content}`.toLowerCase(),
        })),
      )
      .catch(() => {
        index = null;
        return [];
      });
    return index;
  };

  const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /** Escaped text with every match of any term wrapped in <mark>, in one pass. */
  const highlight = (text: string, terms: string[]) => {
    if (!terms.length) return escapeHtml(text);
    let html = '';
    let last = 0;
    for (const match of text.matchAll(new RegExp(terms.map(escapeRegExp).join('|'), 'gi'))) {
      html += `${escapeHtml(text.slice(last, match.index))}<mark>${escapeHtml(match[0])}</mark>`;
      last = match.index + match[0].length;
    }
    return html + escapeHtml(text.slice(last));
  };

  const snippet = (entry: Entry, terms: string[]) => {
    const source = `${entry.description} ${entry.content}`;
    const lower = source.toLowerCase();
    const at = terms.map((t) => lower.indexOf(t)).find((i) => i >= 0) ?? -1;
    if (at < 0) return entry.description;
    let start = Math.max(0, at - 50);
    if (start > 0) {
      const space = source.indexOf(' ', start);
      if (space > -1 && space < at) start = space + 1;
    }
    let end = Math.min(source.length, at + 110);
    const endSpace = source.lastIndexOf(' ', end);
    if (end < source.length && endSpace > at) end = endSpace;
    return `${start > 0 ? '… ' : ''}${source.slice(start, end).trim()}${end < source.length ? ' …' : ''}`;
  };

  const search = (entries: Indexed[], query: string) => {
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    const hits = entries.flatMap((entry) => {
      let score = 0;
      for (const term of terms) {
        const inTitle = entry.titleLower.includes(term);
        const count = entry.textLower.split(term).length - 1;
        if (!inTitle && count === 0) return [];
        score += (inTitle ? 10 : 0) + Math.min(count, 5);
      }
      return [{ entry, score }];
    });
    hits.sort((a, b) => b.score - a.score);
    return { terms, hits: terms.length ? hits.slice(0, 8) : [] };
  };

  const close = () => {
    results.hidden = true;
    results.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const render = async () => {
    const query = input.value.trim();
    selected = -1;
    if (query.length < 2) return close();
    const entries = await load();
    if (input.value.trim() !== query) return;
    const { terms, hits } = search(entries, query);
    results.innerHTML = hits.length
      ? hits
          .map(
            ({ entry }, i) =>
              `<a class="search-result" role="option" id="search-option-${i}" href="${escapeHtml(entry.url)}">` +
              `<span class="search-result-title">${highlight(entry.title, terms)}</span>` +
              `<span class="search-result-meta">${escapeHtml(entry.section)}</span>` +
              `<span class="search-result-snippet">${highlight(snippet(entry, terms), terms)}</span></a>`,
          )
          .join('')
      : `<p class="search-empty">Nothing matches “${escapeHtml(query)}”.</p>`;
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const move = (step: number) => {
    const items = results.querySelectorAll<HTMLAnchorElement>('.search-result');
    if (!items.length) return;
    selected = (selected + step + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('is-selected', i === selected));
    input.setAttribute('aria-activedescendant', items[selected].id);
    items[selected].scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('focus', load, { once: true });
  input.addEventListener('input', render);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter') {
      const target = results.querySelectorAll<HTMLAnchorElement>('.search-result')[Math.max(selected, 0)];
      if (target) {
        event.preventDefault();
        window.location.href = target.href;
      }
    } else if (event.key === 'Escape') {
      if (input.value) {
        event.stopPropagation();
        input.value = '';
        close();
      } else {
        input.blur();
      }
    }
  });
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.search')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && (/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable)) return;
    event.preventDefault();
    setNav(true);
    input.focus();
  });
}
