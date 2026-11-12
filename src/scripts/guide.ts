/** Guide pages: heading links, copy buttons on code blocks and the "On this page" highlight. */
const prose = document.querySelector<HTMLElement>('.prose');
const headings = prose ? [...prose.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')] : [];

for (const heading of headings) {
  const anchor = document.createElement('a');
  anchor.className = 'heading-anchor';
  anchor.href = `#${heading.id}`;
  anchor.setAttribute('aria-label', `Link to “${heading.textContent?.trim()}”`);
  anchor.textContent = '#';
  heading.append(anchor);
}

if (prose && navigator.clipboard) {
  for (const pre of prose.querySelectorAll('pre')) {
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.replaceWith(wrap);
    wrap.append(pre);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary copy-btn';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code');
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText((pre.querySelector('code') ?? pre).innerText.replace(/\n$/, ''));
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = 'Copy'), 1600);
    });
    wrap.append(button);
  }
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('.toc-inline a')) {
  link.addEventListener('click', () => link.closest('details')?.removeAttribute('open'));
}

const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc] a')];
if (headings.length && tocLinks.length) {
  let queued = false;
  const markActive = () => {
    queued = false;
    const offset = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 80;
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - offset > 4) break;
      current = heading;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = headings[headings.length - 1];
    }
    for (const link of tocLinks) link.classList.toggle('is-active', link.hash === `#${current.id}`);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(markActive);
      }
    },
    { passive: true },
  );
  markActive();
}
