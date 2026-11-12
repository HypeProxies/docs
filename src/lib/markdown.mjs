// Markdown conventions from CONTRIBUTING.md, as Sätteri HTML-tree plugins (Astro's Markdown processor).
import { defineHastPlugin } from 'satteri';

/** @param {any} node */
const firstElement = (node) => node.children?.find((/** @type {any} */ child) => child.type === 'element');

/**
 * `> **Note:** ...` becomes a note box and `> **Warning:** ...` a warning box.
 * Other block quotes stay plain quotes.
 */
export const noteBoxes = defineHastPlugin({
  name: 'hp-note-boxes',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      const lead = firstElement(firstElement(node) ?? {});
      if (lead?.tagName !== 'strong') return;
      const kind = { 'Note:': 'note', 'Warning:': 'warning' }[ctx.textContent(lead).trim()];
      if (!kind) return;
      ctx.replaceNode(node, {
        type: 'element',
        tagName: 'aside',
        properties: { className: ['callout', `callout-${kind}`] },
        children: [...node.children],
      });
    },
  },
});

/**
 * Links between guides are written as files (`../vps/connecting.md#ssh`), so they also work when
 * the repo is browsed on GitHub. On the site a guide is `<folder>/<name>.html`.
 */
export const guideLinks = defineHastPlugin({
  name: 'hp-guide-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) return;
      ctx.setProperty(node, 'href', href.replace(/\.md(?=$|#)/, '.html'));
    },
  },
});

/** Tables scroll sideways inside their own box instead of widening the page on a phone. */
export const wrapTables = defineHastPlugin({
  name: 'hp-wrap-tables',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, { type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [] });
    },
  },
});
