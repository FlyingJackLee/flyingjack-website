/* 客户端逻辑。行为与原设计稿一致，区别在于翻译按「路径键」查表，
   而不是按中文原文匹配文本节点 —— 改文案不会静默漏译。 */
(() => {
  'use strict';

  const payload = JSON.parse(document.getElementById('site-payload').textContent);
  const { dict, ui, meta, socials, terminal, defaultLang } = payload;

  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const themeToggle = $('theme-toggle');
  const languageToggle = $('language-toggle');
  const menuToggle = $('menu-toggle');
  const mobileMenu = $('mobile-menu');
  const socialGrid = $('social-grid');
  const socialStatus = $('social-status');

  const store = {
    get(k, fallback) { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 隐私模式 */ } },
  };

  // ?lang=en 优先于 localStorage，让分享出去的链接能带上语言
  const urlLang = new URLSearchParams(location.search).get('lang');
  let lang = ['zh', 'en'].includes(urlLang)
    ? urlLang
    : store.get('developer-portfolio-language', defaultLang);
  if (!['zh', 'en'].includes(lang)) lang = defaultLang;

  let theme = store.get('developer-portfolio-theme', 'dark');
  if (!['dark', 'light'].includes(theme)) theme = 'dark';

  let terminalStep = 0;

  const t = (key) => {
    const entry = dict[key];
    if (!entry) { console.warn('[i18n] 字典里没有这个键：', key); return ''; }
    return entry[lang] ?? entry.zh;
  };

  /* ── 主题 ── */
  const applyTheme = (next) => {
    theme = next;
    root.dataset.theme = next;
    themeToggle.textContent = next === 'dark' ? t('ui.light_mode') : t('ui.dark_mode');
    themeToggle.setAttribute('aria-label', next === 'dark' ? t('ui.light_label') : t('ui.dark_label'));
    store.set('developer-portfolio-theme', next);
  };

  /* ── 移动菜单 ── */
  const setMenu = (open) => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? t('ui.menu_close_label') : t('ui.menu_open_label'));
  };

  /* ── 终端 ── */
  const renderTerminal = () => {
    const cmd = $('terminal-command');
    const out = $('terminal-output');
    if (!cmd || !out || !terminal) return;
    const step = terminal[terminalStep];
    cmd.textContent = step.cmd;
    out.textContent = step.out[lang] ?? step.out.zh;
  };

  /* ── 社交卡片 ── */
  const renderSocials = () => {
    if (!socialGrid) return;
    socialGrid.replaceChildren();
    socialStatus.textContent = '';
    const visible = socials.filter((s) => s.value);

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'social-empty';
      empty.textContent = t('ui.social_empty');
      socialGrid.appendChild(empty);
    }

    visible.forEach((profile) => {
      const item = document.createElement(profile.href ? 'a' : 'button');
      item.className = 'social-link';
      item.dataset.odId = `social-${profile.id}`;

      if (profile.href) {
        item.href = profile.href;
        item.target = '_blank';
        item.rel = 'noreferrer';
      } else {
        item.type = 'button';
        item.addEventListener('click', async () => {
          const indicator = item.querySelector('.social-arrow');
          try {
            await navigator.clipboard.writeText(profile.value);
            indicator.textContent = t('ui.copied');
            socialStatus.textContent = t('ui.copy_success');
            window.setTimeout(() => { indicator.textContent = t('ui.copy'); }, 1400);
          } catch {
            indicator.textContent = '!';
            socialStatus.textContent = t('ui.copy_error');
          }
        });
      }

      const name = profile.name[lang] ?? profile.name.zh;
      item.setAttribute('aria-label', `${name}: ${profile.value}`);

      const mk = (cls, text) => {
        const el = document.createElement('span');
        el.className = cls;
        if (text != null) el.textContent = text;
        return el;
      };
      const copy = mk('social-copy');
      copy.append(mk('social-name', name), mk('social-value', profile.value));
      item.append(mk('social-code', profile.code), copy,
        mk('social-arrow', profile.href ? '↗' : t('ui.copy')));
      socialGrid.appendChild(item);
    });

    socialGrid.setAttribute('aria-label', t('ui.social_label'));
  };

  /* ── 语言 ── */
  const applyLanguage = (next) => {
    lang = next;
    root.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.title = meta.title[next];
    document.querySelector('meta[name="description"]').content = meta.description[next];

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const prefix = el.dataset.i18nPrefix ?? '';
      el.textContent = prefix + t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });

    if (languageToggle) {
      languageToggle.textContent = t('ui.language_button');
      languageToggle.setAttribute('aria-label', t('ui.language_label'));
    }

    setMenu(mobileMenu ? !mobileMenu.hidden : false);
    renderTerminal();
    renderSocials();
    applyTheme(theme);
    store.set('developer-portfolio-language', next);
  };

  /* ── 事件 ── */
  themeToggle?.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
  languageToggle?.addEventListener('click', () => applyLanguage(lang === 'zh' ? 'en' : 'zh'));
  menuToggle?.addEventListener('click', () => setMenu(mobileMenu.hidden));
  mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 821px)')
    .addEventListener('change', (ev) => { if (ev.matches) setMenu(false); });

  /* ── 项目筛选（仅首页） ── */
  const filterButtons = [...document.querySelectorAll('.filter-btn')];
  if (filterButtons.length) {
    const cards = [...document.querySelectorAll('.project-card')];
    const valid = new Set(filterButtons.map((b) => b.dataset.filter));
    const applyFilter = (f) => {
      if (!valid.has(f)) f = 'all';
      filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === f)));
      cards.forEach((c) => {
        c.hidden = f !== 'all' && !c.dataset.category.split(' ').includes(f);
      });
      store.set('developer-portfolio-filter', f);
    };
    filterButtons.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
    applyFilter(store.get('developer-portfolio-filter', 'all'));
  }

  applyLanguage(lang);

  if (terminal && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setTimeout(() => { terminalStep = 1; renderTerminal(); }, 2800);
  }
})();
