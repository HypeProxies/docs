/* HypeProxies Docs: mobile menu, "On this page", heading links, copy buttons, search. No dependencies. */
(function () {
  "use strict";

  var body = document.body;
  var prose = document.querySelector(".prose");

  /* ---------- Mobile menu ---------- */
  var backdrop = document.querySelector("[data-nav-close]");
  var toggles = document.querySelectorAll("[data-nav-toggle]");

  function setNav(open) {
    body.classList.toggle("nav-open", open);
    if (backdrop) backdrop.hidden = !open;
    toggles.forEach(function (t) { t.setAttribute("aria-expanded", open ? "true" : "false"); });
  }
  toggles.forEach(function (t) {
    t.addEventListener("click", function () { setNav(!body.classList.contains("nav-open")); });
  });
  if (backdrop) backdrop.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && body.classList.contains("nav-open")) setNav(false);
  });
  window.matchMedia("(min-width: 961px)").addEventListener("change", function (e) {
    if (e.matches) setNav(false);
  });

  /* ---------- Tables scroll sideways on small screens ---------- */
  if (prose) {
    prose.querySelectorAll("table").forEach(function (table) {
      if (table.parentElement.classList.contains("table-wrap")) return;
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ---------- Heading links + "On this page" ---------- */
  var headings = prose ? Array.prototype.slice.call(prose.querySelectorAll("h2[id], h3[id]")) : [];

  var headingText = headings.map(function (h) { return h.textContent.trim(); });

  headings.forEach(function (h) {
    var a = document.createElement("a");
    a.className = "heading-anchor";
    a.href = "#" + h.id;
    a.setAttribute("aria-label", "Link to this section");
    a.textContent = "#";
    h.appendChild(a);
  });

  var tocLists = document.querySelectorAll("[data-toc]");
  if (headings.length >= 2 && tocLists.length) {
    tocLists.forEach(function (list) {
      headings.forEach(function (h, i) {
        var li = document.createElement("li");
        li.className = "toc-" + h.tagName.toLowerCase();
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = headingText[i];
        li.appendChild(a);
        list.appendChild(li);
      });
      var box = list.closest(".toc, .toc-inline");
      if (box) box.hidden = false;
    });

    document.querySelectorAll(".toc-inline a").forEach(function (a) {
      a.addEventListener("click", function () { a.closest("details").open = false; });
    });

    var tocLinks = document.querySelectorAll(".toc a");
    var ticking = false;
    function markActive() {
      ticking = false;
      var offset = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 90;
      var current = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].getBoundingClientRect().top - offset <= 4) current = headings[i];
        else break;
      }
      if (!current) current = headings[0];
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) current = headings[headings.length - 1];
      tocLinks.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + current.id);
      });
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(markActive); }
    }, { passive: true });
    markActive();
  }

  /* ---------- Copy buttons on code blocks ---------- */
  if (prose && navigator.clipboard) {
    prose.querySelectorAll("pre").forEach(function (pre) {
      var host = pre.closest(".highlighter-rouge") || pre;
      if (host.querySelector(".copy-btn")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy to clipboard");
      btn.addEventListener("click", function () {
        var code = pre.querySelector("code") || pre;
        navigator.clipboard.writeText(code.innerText.replace(/\n$/, "")).then(function () {
          btn.textContent = "Copied";
          btn.classList.add("is-copied");
          setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("is-copied"); }, 1600);
        });
      });
      host.appendChild(btn);
    });
  }

  /* ---------- Search ---------- */
  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  if (!input || !results) return;

  var index = null;
  var loading = null;
  var selected = -1;

  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch(input.getAttribute("data-index"))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          index = data.map(function (d) {
            d._title = (d.title || "").toLowerCase();
            d._text = ((d.description || "") + " " + (d.content || "")).toLowerCase();
            return d;
          });
          return index;
        })
        .catch(function () { loading = null; return []; });
    }
    return loading;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function snippet(doc, terms) {
    var source = (doc.description || "") + " " + (doc.content || "");
    var lower = source.toLowerCase();
    var pos = -1;
    for (var i = 0; i < terms.length && pos < 0; i++) pos = lower.indexOf(terms[i]);
    if (pos < 0) return doc.description || "";
    var start = Math.max(0, pos - 50);
    if (start > 0) {
      var space = source.indexOf(" ", start);
      if (space > -1 && space < pos) start = space + 1;
    }
    var end = Math.min(source.length, pos + 110);
    var endSpace = source.lastIndexOf(" ", end);
    if (end < source.length && endSpace > pos) end = endSpace;
    return (start > 0 ? "… " : "") + source.slice(start, end).trim() + (end < source.length ? " …" : "");
  }

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return { terms: terms, hits: [] };
    var hits = [];
    index.forEach(function (d) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        var inTitle = d._title.indexOf(t) >= 0;
        var inText = d._text.indexOf(t) >= 0;
        if (!inTitle && !inText) return;
        score += inTitle ? 10 : 0;
        score += inText ? Math.min(d._text.split(t).length - 1, 5) : 0;
      }
      hits.push({ doc: d, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    return { terms: terms, hits: hits.slice(0, 8) };
  }

  function render() {
    var q = input.value.trim();
    selected = -1;
    if (q.length < 2) { close(); return; }
    load().then(function () {
      if (input.value.trim() !== q) return;
      var r = search(q);
      if (!r.hits.length) {
        results.innerHTML = '<p class="search-empty">No guides match “' + escapeHtml(q) + '”.</p>';
      } else {
        results.innerHTML = r.hits.map(function (h, i) {
          var d = h.doc;
          return '<a class="search-result" role="option" id="search-opt-' + i + '" href="' + d.url + '">' +
            '<span class="search-result-title">' + highlight(d.title, r.terms) + "</span>" +
            '<span class="search-result-meta">' + escapeHtml(d.category || "") + "</span>" +
            '<span class="search-result-snippet">' + highlight(snippet(d, r.terms), r.terms) + "</span></a>";
        }).join("");
      }
      results.hidden = false;
      input.setAttribute("aria-expanded", "true");
    });
  }

  function close() {
    results.hidden = true;
    results.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function move(step) {
    var items = results.querySelectorAll(".search-result");
    if (!items.length) return;
    selected = (selected + step + items.length) % items.length;
    items.forEach(function (el, i) { el.classList.toggle("is-selected", i === selected); });
    input.setAttribute("aria-activedescendant", items[selected].id);
    items[selected].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("focus", load, { once: true });
  input.addEventListener("input", render);
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      var items = results.querySelectorAll(".search-result");
      var target = items[selected >= 0 ? selected : 0];
      if (target) { e.preventDefault(); window.location.href = target.href; }
    } else if (e.key === "Escape") {
      if (input.value) { input.value = ""; close(); } else { input.blur(); }
    }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || document.activeElement.isContentEditable) return;
    e.preventDefault();
    if (window.matchMedia("(max-width: 960px)").matches) setNav(true);
    input.focus();
  });
})();
