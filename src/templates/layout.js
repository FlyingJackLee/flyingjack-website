// 页面骨架：topbar / mobile-menu / footer / head
// 与原稿逐节点对应，唯一新增的是 data-i18n 属性

export function layout(ctx, { bodyHtml, extraCss = [], meta }) {
  const d = ctx.data;
  const p = ctx.prefix;
  const nav = d.nav
    .map((n, i) => `<a href="${esc2(p + n.href)}"${ctx.k(`nav.${i}.label`)}>${ctx.v(`nav.${i}.label`)}</a>`)
    .join('');
  const mobileNav = d.nav
    .map((n, i) => `<a href="${esc2(p + n.href)}"${ctx.k(`nav.${i}.label`)}>${ctx.v(`nav.${i}.label`)}</a>`)
    .join('');

  const css = ['assets/styles.css', ...extraCss]
    .map((f) => `  <link rel="stylesheet" href="${ctx.url(f)}">`)
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc2(meta.description.zh)}">
  <title>${esc2(meta.title.zh)}</title>
${css}
</head>
<body>
  <header class="topbar" data-od-id="top-navigation">
    <div class="container topbar-inner">
      <a class="brand" href="${ctx.url('')}#home" data-od-id="brand-link">${esc2(d.site.brand.head)}<span class="brand-mark">${esc2(d.site.brand.mark)}</span>${esc2(d.site.brand.tail)}</a>
      <nav class="nav"${ctx.attr('aria-label', 'ui.nav_label')} data-od-id="main-navigation">
        ${nav}
        <span class="nav-controls">
          <button class="menu-toggle" id="menu-toggle" type="button" data-od-id="menu-toggle" aria-expanded="false" aria-controls="mobile-menu"${ctx.own('aria-label', 'ui.menu_open_label')}>${ctx.v('ui.menu')}</button>
          <button class="language-toggle" id="language-toggle" type="button" data-od-id="language-toggle"${ctx.own('aria-label', 'ui.language_label')}>${ctx.v('ui.language_button')}</button>
          <button class="theme-toggle" id="theme-toggle" type="button" data-od-id="theme-toggle"${ctx.own('aria-label', 'ui.theme_label')}>${ctx.v('ui.light_mode')}</button>
        </span>
      </nav>
    </div>
    <div class="mobile-menu" id="mobile-menu" hidden>
      <nav class="container mobile-menu-inner"${ctx.attr('aria-label', 'ui.mobile_nav_label')} data-od-id="mobile-navigation">
        ${mobileNav}
      </nav>
    </div>
  </header>

${bodyHtml}

  <footer class="footer" data-od-id="footer"><div class="container footer-inner"><span${ctx.k('footer.left')}>${ctx.v('footer.left')}</span><span${ctx.k('footer.right')}>${ctx.v('footer.right')}</span></div></footer>

  <script id="site-payload" type="application/json">__PAYLOAD__</script>
  <script src="${ctx.url('assets/app.js')}"></script>
</body>
</html>
`;
}

const E = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => E[c]);
