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


  /* 平台图标。路径取自 Simple Icons（CC0），24×24 viewBox。
     没有对应图标的平台回退到两字母代号，所以往 site.yaml 里加新平台不会开天窗。 */
  const ICONS = {
    github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    wechat: 'M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.126 2.361-.348a.702.702 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.858zm-3.9 3.201c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z',
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
    telegram: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  };

  const NS = 'http://www.w3.org/2000/svg';
  const codeCell = (profile) => {
    const el = document.createElement('span');
    el.className = 'social-code';
    const d = ICONS[profile.id];
    if (!d) { el.textContent = profile.code; return el; }
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    el.appendChild(svg);
    return el;
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
      item.append(codeCell(profile), copy,
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

  // 原稿只在 2800ms 切到第 2 步就停住，第 3、4 步的文案从未被渲染过。
  // 改为循环播完全部步骤；减少动态效果偏好下保持在第一步不动。
  if (terminal && terminal.length > 1
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {
      terminalStep = (terminalStep + 1) % terminal.length;
      renderTerminal();
    }, 4000);
  }
})();
