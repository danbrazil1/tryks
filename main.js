/* ============================================================
   Tryks — site estático · JS vanilla
   - i18n por dicionário JSON (data-i18n / data-i18n-ph / -alt / -aria)
   - selos das lojas controlados por flags (config.js)
   - depoimentos renderizados de config (seção oculta quando vazio)
   - página Bases: catálogo via fetch + busca/filtro/ordenação,
     deep link tryks://import com fallback para a loja
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.TRYKS_CONFIG || {};
  var DEFAULT_LANG = cfg.DEFAULT_LANG || 'pt';
  var LANGS = cfg.LANGS || ['pt'];
  var dict = null; // dicionário carregado (null = usar o texto do HTML, que é PT)

  /* ---------- idioma ---------- */

  function pickLang() {
    try {
      var urlLang = new URLSearchParams(location.search).get('lang');
      if (urlLang && LANGS.indexOf(urlLang) !== -1) {
        localStorage.setItem('tryks_lang', urlLang);
        return urlLang;
      }
      var saved = localStorage.getItem('tryks_lang');
      if (saved && LANGS.indexOf(saved) !== -1) return saved;
      var nav = (navigator.language || '').slice(0, 2).toLowerCase();
      if (LANGS.indexOf(nav) !== -1) return nav;
    } catch (e) { /* storage bloqueado — segue o default */ }
    return DEFAULT_LANG;
  }

  var lang = pickLang();

  function t(key) {
    if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    return null; // sem dicionário → mantém o texto baked (PT)
  }

  function applyDictTo(root) {
    if (!dict) return;
    var el, i, list;
    list = root.querySelectorAll('[data-i18n]');
    for (i = 0; i < list.length; i++) {
      el = list[i];
      var v = t(el.getAttribute('data-i18n'));
      if (v !== null) el.textContent = v;
    }
    list = root.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < list.length; i++) {
      el = list[i];
      var p = t(el.getAttribute('data-i18n-ph'));
      if (p !== null) el.setAttribute('placeholder', p);
    }
    list = root.querySelectorAll('[data-i18n-alt]');
    for (i = 0; i < list.length; i++) {
      el = list[i];
      var a = t(el.getAttribute('data-i18n-alt'));
      if (a !== null) el.setAttribute('alt', a);
    }
    list = root.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < list.length; i++) {
      el = list[i];
      var r = t(el.getAttribute('data-i18n-aria'));
      if (r !== null) el.setAttribute('aria-label', r);
    }
  }

  function applyI18n() {
    if (!dict) return;
    document.documentElement.lang = lang;
    applyDictTo(document);
    // <template> não entra no querySelectorAll do documento
    var tpls = document.querySelectorAll('template');
    for (var i = 0; i < tpls.length; i++) applyDictTo(tpls[i].content);
    // <title> e meta description
    var titleKey = document.body.getAttribute('data-title-key');
    var descKey = document.body.getAttribute('data-desc-key');
    var tv = titleKey && t(titleKey);
    if (tv) document.title = tv;
    var dv = descKey && t(descKey);
    var meta = document.querySelector('meta[name="description"]');
    if (dv && meta) meta.setAttribute('content', dv);
  }

  function loadLang(done) {
    // PT já vem "assado" no HTML — não precisa de fetch (funciona offline/file://)
    if (lang === DEFAULT_LANG) { done(); return; }
    var base = document.body.getAttribute('data-root') || '.';
    fetch(base + '/i18n/' + lang + '.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) { dict = json; applyI18n(); done(); })
      .catch(function () { lang = DEFAULT_LANG; done(); });
  }

  function setupLangSelector() {
    var sels = document.querySelectorAll('.lang-select');
    for (var i = 0; i < sels.length; i++) {
      var sel = sels[i];
      var wrap = sel.closest('.lang-wrap');
      if (LANGS.length < 2) { if (wrap) wrap.hidden = true; continue; }
      if (wrap) wrap.hidden = false;
      sel.innerHTML = '';
      for (var j = 0; j < LANGS.length; j++) {
        var opt = document.createElement('option');
        opt.value = LANGS[j];
        opt.textContent = (cfg.LANG_NAMES && cfg.LANG_NAMES[LANGS[j]]) || LANGS[j];
        if (LANGS[j] === lang) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', function (e) {
        try { localStorage.setItem('tryks_lang', e.target.value); } catch (err) {}
        var u = new URL(location.href);
        u.searchParams.set('lang', e.target.value);
        location.href = u.toString();
      });
    }
  }

  /* ---------- selos das lojas ---------- */

  function setupStoreBadges() {
    var badges = document.querySelectorAll('[data-store]');
    for (var i = 0; i < badges.length; i++) {
      var b = badges[i];
      var kind = b.getAttribute('data-store'); // 'play' | 'appstore'
      var live = kind === 'play' ? cfg.PLAY_STORE_LIVE : cfg.APP_STORE_LIVE;
      var url = kind === 'play' ? cfg.PLAY_STORE_URL : cfg.APP_STORE_URL;
      var small = b.querySelector('.badge-kicker');
      if (live && url) {
        b.classList.remove('is-soon');
        b.setAttribute('href', url);
        b.setAttribute('rel', 'noopener');
        b.setAttribute('target', '_blank');
        if (small) small.setAttribute('data-i18n', kind === 'play' ? 'store.availablePlay' : 'store.availableApp');
      } else {
        b.classList.add('is-soon');
        b.removeAttribute('href');
        b.setAttribute('role', 'text');
        b.setAttribute('aria-disabled', 'true');
        if (small) small.setAttribute('data-i18n', kind === 'play' ? 'store.soonPlay' : 'store.soonApp');
      }
    }
  }

  /* ---------- header / navegação mobile ---------- */

  function setupNav() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('site-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = document.body.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          document.body.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- animação de entrada ---------- */

  function setupReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('revealed');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ---------- depoimentos (ocultos enquanto vazios) ---------- */

  function setupTestimonials() {
    var section = document.getElementById('depoimentos');
    if (!section) return;
    var items = (cfg.SHOW_TESTIMONIALS && cfg.TESTIMONIALS) || [];
    if (!items.length) { section.hidden = true; return; }
    section.hidden = false;
    var grid = section.querySelector('.testimonials-grid');
    var tpl = document.getElementById('tpl-testimonial');
    if (!grid || !tpl) return;
    grid.innerHTML = '';
    items.forEach(function (it) {
      var node = tpl.content.cloneNode(true);
      node.querySelector('.t-text').textContent = '“' + it.text + '”';
      node.querySelector('.t-author').textContent = it.author || '';
      node.querySelector('.t-detail').textContent = it.detail || '';
      grid.appendChild(node);
    });
  }

  /* ---------- rodapé ---------- */

  function setupFooter() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
    var mails = document.querySelectorAll('[data-mail]');
    for (var i = 0; i < mails.length; i++) {
      mails[i].setAttribute('href', 'mailto:' + (cfg.CONTACT_EMAIL || 'contato@tryks.app'));
      if (mails[i].hasAttribute('data-mail-text')) mails[i].textContent = cfg.CONTACT_EMAIL || 'contato@tryks.app';
    }
  }

  /* ---------- deep link de importação + fallback ---------- */

  var fallbackTimer = null;

  function attemptImport(jsonUrl) {
    var deep = (cfg.DEEP_LINK_PREFIX || 'tryks://import?url=') + encodeURIComponent(jsonUrl);
    clearTimeout(fallbackTimer);
    var hidden = false;
    var onVis = function () { if (document.hidden) hidden = true; };
    document.addEventListener('visibilitychange', onVis);
    fallbackTimer = setTimeout(function () {
      document.removeEventListener('visibilitychange', onVis);
      if (!hidden) showFallback();
    }, 1800);
    location.href = deep;
  }

  function showFallback() {
    var modal = document.getElementById('import-fallback');
    if (!modal) return;
    // enquanto a Play Store não está no ar, oferece o teste fechado
    var testing = modal.querySelector('.fallback-testing');
    if (testing) {
      var showTesting = !cfg.PLAY_STORE_LIVE && cfg.PLAY_TESTING_URL;
      testing.hidden = !showTesting;
      var a = testing.querySelector('a');
      if (a && cfg.PLAY_TESTING_URL) a.setAttribute('href', cfg.PLAY_TESTING_URL);
    }
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function setupFallbackModal() {
    var modal = document.getElementById('import-fallback');
    if (!modal) return;
    function close() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
    }
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.modal-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  function wireImportButtons(root) {
    var btns = (root || document).querySelectorAll('[data-import-json]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) {
        e.preventDefault();
        var file = e.currentTarget.getAttribute('data-import-json');
        var url = /^https?:\/\//.test(file) ? file : (cfg.JSON_BASE_URL || '') + file;
        attemptImport(url);
      });
    }
  }

  /* ---------- página Bases: catálogo da comunidade ---------- */

  var catalog = [];

  function renderCatalog() {
    var tbody = document.getElementById('catalog-body');
    var cards = document.getElementById('catalog-cards');
    var empty = document.getElementById('catalog-empty');
    var tplRow = document.getElementById('tpl-base-row');
    var tplCard = document.getElementById('tpl-base-card');
    if (!tbody || !cards || !tplRow || !tplCard) return;

    var q = (document.getElementById('base-search') || {}).value || '';
    q = q.trim().toLowerCase();
    var act = (document.getElementById('base-activity') || {}).value || '';
    var sort = (document.getElementById('base-sort') || {}).value || 'recent';

    var rows = catalog.filter(function (b) {
      if (act && b.activity !== act) return false;
      if (!q) return true;
      var hay = [b.activity, b.description, b.author, (b.tags || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    rows.sort(function (a, b) {
      if (sort === 'videos') return (b.videoCount || 0) - (a.videoCount || 0);
      if (sort === 'az') return String(a.description).localeCompare(String(b.description), lang);
      return String(b.exportDate).localeCompare(String(a.exportDate)); // recent
    });

    tbody.innerHTML = '';
    cards.innerHTML = '';
    if (empty) empty.hidden = rows.length > 0;

    var fmt;
    try { fmt = new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : lang, { dateStyle: 'short' }); } catch (e) { fmt = null; }

    rows.forEach(function (b) {
      var dateTxt = b.exportDate;
      if (fmt) {
        var d = new Date(b.exportDate + 'T12:00:00');
        if (!isNaN(d)) dateTxt = fmt.format(d);
      }
      fillBase(tplRow, tbody, b, dateTxt);
      fillBase(tplCard, cards, b, dateTxt);
    });
    wireImportButtons(tbody.closest('section'));
  }

  function fillBase(tpl, target, b, dateTxt) {
    var node = tpl.content.cloneNode(true);
    var set = function (sel, val) {
      var el = node.querySelector(sel);
      if (el) el.textContent = val == null ? '' : String(val);
    };
    set('.b-activity', b.activity);
    set('.b-desc', b.description);
    set('.b-author', b.author);
    set('.b-count', b.videoCount);
    set('.b-date', dateTxt);
    var tagsEl = node.querySelector('.b-tags');
    if (tagsEl) {
      tagsEl.innerHTML = '';
      (b.tags || []).forEach(function (tag) {
        var s = document.createElement('span');
        s.className = 'tag-chip';
        s.textContent = tag;
        tagsEl.appendChild(s);
      });
    }
    var btn = node.querySelector('[data-import-json]');
    if (btn) btn.setAttribute('data-import-json', b.jsonUrl || (b.slug + '.json'));
    target.appendChild(node);
  }

  function setupCatalog() {
    var tbody = document.getElementById('catalog-body');
    if (!tbody) return; // não é a página Bases
    var loading = document.getElementById('catalog-loading');
    var errorEl = document.getElementById('catalog-error');

    fetch(cfg.CATALOG_URL || './catalogo.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) {
        catalog = Array.isArray(json) ? json : [];
        if (loading) loading.hidden = true;
        // popula o filtro de atividades
        var sel = document.getElementById('base-activity');
        if (sel) {
          var seen = {};
          catalog.forEach(function (b) {
            if (b.activity && !seen[b.activity]) {
              seen[b.activity] = true;
              var opt = document.createElement('option');
              opt.value = b.activity;
              opt.textContent = b.activity;
              sel.appendChild(opt);
            }
          });
        }
        renderCatalog();
      })
      .catch(function () {
        if (loading) loading.hidden = true;
        if (errorEl) errorEl.hidden = false;
      });

    ['base-search', 'base-activity', 'base-sort'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', renderCatalog);
      el.addEventListener('change', renderCatalog);
    });
  }

  /* ---------- Tally (envio de bases) ---------- */

  function setupTally() {
    var slot = document.getElementById('tally-slot');
    if (!slot) return;
    var soon = document.getElementById('tally-soon');
    if (cfg.TALLY_FORM_ID) {
      if (soon) soon.hidden = true;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://tally.so/embed/' + cfg.TALLY_FORM_ID + '?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
      iframe.loading = 'lazy';
      iframe.width = '100%';
      iframe.height = '380';
      iframe.frameBorder = '0';
      iframe.title = 'Formulário de envio de base';
      slot.appendChild(iframe);
    } else if (soon) {
      soon.hidden = false;
    }
  }

  /* ---------- boot ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    setupStoreBadges(); // ajusta as chaves data-i18n antes do applyI18n
    loadLang(function () {
      applyI18n(); // no PT vira no-op (HTML já é PT)
      setupLangSelector();
      setupNav();
      setupReveal();
      setupTestimonials();
      setupFooter();
      setupFallbackModal();
      wireImportButtons(document);
      setupCatalog();
      setupTally();
    });
  });
})();
