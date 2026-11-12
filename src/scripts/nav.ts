/** Phone and tablet menu: the sidebar slides in over the page. */
const body = document.body;
const toggles = document.querySelectorAll<HTMLElement>('[data-nav-toggle]');
const closers = document.querySelectorAll<HTMLElement>('[data-nav-close]');
const backdrop = document.querySelector<HTMLElement>('.nav-backdrop');
const desktop = window.matchMedia('(min-width: 1024px)');

export function setNav(open: boolean) {
  if (desktop.matches) open = false;
  body.classList.toggle('nav-open', open);
  if (backdrop) backdrop.hidden = !open;
  for (const toggle of toggles) toggle.setAttribute('aria-expanded', String(open));
  if (open) document.querySelector<HTMLElement>('#sidebar a, #sidebar input')?.focus();
}

for (const toggle of toggles) toggle.addEventListener('click', () => setNav(!body.classList.contains('nav-open')));
for (const closer of closers) closer.addEventListener('click', () => setNav(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('nav-open')) {
    setNav(false);
    toggles[0]?.focus();
  }
});
desktop.addEventListener('change', () => setNav(false));
