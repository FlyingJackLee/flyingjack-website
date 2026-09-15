// 项目详情页。复用 topbar / container / section / tag / resume-link 等
// 既有组件与 brand-spec token，新增样式全部在 site.css 内。
// case 里没有 body / items / links 的小节不渲染。

import { idx } from '../render.js';

const E = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const e  = (s) => String(s).replace(/[&<>"']/g, (c) => E[c]);   // 属性值
const et = (s) => String(s).replace(/[&<>]/g, (c) => E[c]);      // 文本节点

export function projectBody(ctx, i) {
  const p = ctx.data.projects.items[i];
  const base = idx('projects.items', i);
  const tags = p.tags.map((t) => `<span class="tag">${et(t)}</span>`).join('');

  const blocks = p.case
    .map((s, j) => {
      const b = `${base}.case.${j}`;
      const hasBody = !!s.body;
      const hasItems = Array.isArray(s.items) && s.items.length > 0;
      const hasLinks = Array.isArray(s.links) && s.links.length > 0;
      if (!hasBody && !hasItems && !hasLinks) return null;   // 未撰写的小节不渲染

      const parts = [];
      if (hasBody) parts.push(`<p${ctx.k(`${b}.body`)}>${ctx.v(`${b}.body`)}</p>`);
      if (hasItems) {
        const lis = s.items
          .map((_, n) => `<li${ctx.k(`${b}.items.${n}`)}>${ctx.v(`${b}.items.${n}`)}</li>`)
          .join('');
        parts.push(`<ul>${lis}</ul>`);
      }
      if (hasLinks) {
        const as = s.links
          .map((l) => `<a href="${e(l.url)}" target="_blank" rel="noreferrer">${et(l.label)} ↗</a>`)
          .join('');
        parts.push(`<div class="case-links">${as}</div>`);
      }
      return `          <section class="case-block"><h2${ctx.k(`${b}.heading`)}>${ctx.v(`${b}.heading`)}</h2>${parts.join('')}</section>`;
    })
    .filter(Boolean)
    .join('\n');

  return `  <main id="content">
    <article class="section">
      <div class="container">
        <header class="case-head">
          <p class="eyebrow"><span${ctx.k(`${base}.kind`)} data-i18n-prefix="${e(p.index)} / ">${et(p.index)} / ${ctx.v(`${base}.kind`)}</span></p>
          <h1${ctx.k(`${base}.title`)}>${ctx.v(`${base}.title`)}</h1>
          <p class="case-meta"><span${ctx.k(`${base}.meta.org`)}>${ctx.v(`${base}.meta.org`)}</span><span${ctx.k(`${base}.meta.date`)}>${ctx.v(`${base}.meta.date`)}</span><span${ctx.k(`${base}.badge`)}>${ctx.v(`${base}.badge`)}</span></p>
          <div class="tags">${tags}</div>
        </header>
        <div class="case-body">
${blocks}
        </div>
        <div class="case-foot"><a class="resume-link" href="${ctx.url('index.html')}#projects"${ctx.k('ui.back_home')} data-i18n-prefix="← ">← ${ctx.v('ui.back_home')}</a></div>
      </div>
    </article>
  </main>`;
}
