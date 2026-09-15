// 首页。节点结构与原设计稿逐一对应，差异仅限于：
//   · 每个文案节点新增 data-i18n 属性
//   · <img> 外包 <picture>（外链 WebP + JPEG 兑退）
//   · 项目卡 4 → 5 张，时间线 3 → 4 条
//   · 折叠内的大纲取自详情页真实小节标题，并新增一条进详情页的链接

import { idx } from '../render.js';

const E = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const e  = (s) => String(s).replace(/[&<>"']/g, (c) => E[c]);   // 属性值
const et = (s) => String(s).replace(/[&<>]/g, (c) => E[c]);      // 文本节点

export function indexBody(ctx) {
  const d = ctx.data;
  return `  <main id="content">
${hero(ctx, d)}

${capabilities(ctx, d)}

${terminal(ctx, d)}

${projects(ctx, d)}

${experience(ctx, d)}

${stack(ctx, d)}

${contact(ctx, d)}
  </main>`;
}

/* ─────────────────────────────── 首屏 ─────────────────────────────── */
function hero(ctx, d) {
  const h = d.hero;
  const actions = h.actions
    .map((a, i) => `<a class="btn btn-${e(a.variant)}" href="${e(a.href)}" data-od-id="${a.variant === 'primary' ? 'projects-primary' : 'contact-secondary'}"${ctx.k(idx('hero.actions', i, 'label'))}>${ctx.v(idx('hero.actions', i, 'label'))}</a>`)
    .join('');

  const photo = h.photo?.webp
    ? `<picture><source srcset="${ctx.url(h.photo.webp)}" type="image/webp"><img class="profile-photo" data-od-id="profile-photo" src="${ctx.url(h.photo.jpg)}" width="${e(h.photo.width)}" height="${e(h.photo.height)}" decoding="async"${ctx.attr('alt', 'hero.photo.alt')}></picture>`
    : `<div class="photo-placeholder" data-od-id="profile-photo">PHOTO</div>`;

  const grid = h.note.grid
    .map((_, i) => `<div><dt${ctx.k(idx('hero.note.grid', i, 'dt'))}>${ctx.v(idx('hero.note.grid', i, 'dt'))}</dt><dd${ctx.k(idx('hero.note.grid', i, 'dd'))}>${ctx.v(idx('hero.note.grid', i, 'dd'))}</dd></div>`)
    .join('');

  const resumeLink = h.note.link?.href?.zh
    ? `\n        <a class="resume-link"${ctx.attr('href', 'hero.note.link.href')} data-od-id="resume-link"${ctx.k('hero.note.link.label')}>${ctx.v('hero.note.link.label')}</a>`
    : '';

  return `    <section class="future-hero" id="home" data-od-id="hero-section">
      <div class="outline-word" aria-hidden="true">${et(h.outline_word)}</div>
      <div class="future-copy">
        <p class="eyebrow"${ctx.k('hero.eyebrow')}>${ctx.v('hero.eyebrow')}</p>
        <h1 data-od-id="hero-heading"${ctx.k('hero.name')}>${ctx.v('hero.name')}</h1>
        <p class="future-role"${ctx.k('hero.role')}>${ctx.v('hero.role')}</p>
        <p class="hero-lead" data-od-id="hero-description"${ctx.k('hero.lead')}>${ctx.v('hero.lead')}</p>
        <div class="hero-actions">${actions}</div>
      </div>
      <div class="portrait-stage" data-od-id="portrait-stage">
        <span class="coordinate coordinate-a" aria-hidden="true">${et(h.coordinates.a)}</span><span class="coordinate coordinate-b" aria-hidden="true">${et(h.coordinates.b)}</span>
        ${photo}
      </div>
      <aside class="future-note" data-od-id="profile-card"${ctx.attr('aria-label', 'ui.profile_label')}>
        <p class="note-index"${ctx.k('hero.note.index')}>${ctx.v('hero.note.index')}</p>
        <h2${ctx.k('hero.note.heading')}>${ctx.v('hero.note.heading')}</h2>
        <dl class="note-grid">${grid}</dl>${resumeLink}
      </aside>
    </section>`;
}

/* ───────────────────────────── 能力地图 ───────────────────────────── */
function capabilities(ctx, d) {
  const cards = d.capabilities.items
    .map((c, i) => `          <article class="capability" data-od-id="capability-${e(c.id)}"><p class="capability-code">${et(c.code)}</p><h3${ctx.k(idx('capabilities.items', i, 'title'))}>${ctx.v(idx('capabilities.items', i, 'title'))}</h3><p${ctx.k(idx('capabilities.items', i, 'body'))}>${ctx.v(idx('capabilities.items', i, 'body'))}</p></article>`)
    .join('\n');

  return `    <section class="section" id="capabilities" data-od-id="capabilities-section">
      <div class="container">
        ${title(ctx, 'capabilities', 'capabilities-heading')}
        <div class="capabilities">
${cards}
        </div>
      </div>
    </section>`;
}

/* ─────────────────────────────── 终端 ─────────────────────────────── */
function terminal(ctx, d) {
  const s0 = d.terminal.steps[0];
  return `    <section class="section" data-od-id="terminal-section">
      <div class="container">
        <div class="terminal" data-od-id="agent-terminal">
          <div class="terminal-head"><span>${et(d.terminal.host)}</span><span${ctx.k('terminal.status')}>${ctx.v('terminal.status')}</span></div>
          <div class="terminal-body" aria-live="polite"><div><span class="terminal-prompt">$</span> <span id="terminal-command">${et(s0.cmd)}</span><span class="cursor" aria-hidden="true"></span></div><div class="terminal-output" id="terminal-output">${et(s0.out.zh)}</div></div>
        </div>
      </div>
    </section>`;
}

/* ─────────────────────────────── 项目 ─────────────────────────────── */
function projects(ctx, d) {
  const filters = d.projects.filters
    .map((f, i) => `          <button class="filter-btn" type="button" data-filter="${e(f.id)}" data-od-id="filter-${e(f.id)}" aria-pressed="${f.id === 'all'}"${ctx.k(idx('projects.filters', i, 'label'))}>${ctx.v(idx('projects.filters', i, 'label'))}</button>`)
    .join('\n');

  const cards = d.projects.items
    .map((p, i) => {
      const base = idx('projects.items', i);
      const tags = p.tags.map((t) => `<span class="tag">${et(t)}</span>`).join('');
      const outline = p.case
        .map((_, j) => `<li${ctx.k(`${base}.case.${j}.heading`)}>${ctx.v(`${base}.case.${j}.heading`)}</li>`)
        .join('');
      return `          <article class="project-card" data-category="${e(p.category.join(' '))}" data-od-id="project-card-${e(p.slug)}"><div class="project-top"><span${ctx.k(`${base}.kind`)} data-i18n-prefix="${e(p.index)} / ">${et(p.index)} / ${ctx.v(`${base}.kind`)}</span><span${ctx.k(`${base}.badge`)}>${ctx.v(`${base}.badge`)}</span></div><h3${ctx.k(`${base}.title`)}>${ctx.v(`${base}.title`)}</h3><p${ctx.k(`${base}.blurb`)}>${ctx.v(`${base}.blurb`)}</p><div class="tags">${tags}</div><details class="project-details"><summary${ctx.k('projects.case_summary')}>${ctx.v('projects.case_summary')}</summary><ul>${outline}</ul><a class="resume-link" href="${ctx.url(`projects/${p.slug}.html`)}"${ctx.k('projects.case_link')}>${ctx.v('projects.case_link')}</a></details></article>`;
    })
    .join('\n');

  return `    <section class="section" id="projects" data-od-id="projects-section">
      <div class="container">
        ${title(ctx, 'projects', 'projects-heading')}
        <div class="filter-row" role="group"${ctx.attr('aria-label', 'ui.filter_label')} data-od-id="project-filters">
${filters}
        </div>
        <div class="project-grid">
${cards}
        </div>
      </div>
    </section>`;
}

/* ─────────────────────────────── 经历 ─────────────────────────────── */
function experience(ctx, d) {
  const rows = d.experience.items
    .map((x, i) => {
      const b = idx('experience.items', i);
      return `          <article class="timeline-item" data-od-id="experience-${e(x.id)}"><time class="timeline-date"${ctx.k(`${b}.date`)}>${ctx.v(`${b}.date`)}</time><div><h3${ctx.k(`${b}.title`)}>${ctx.v(`${b}.title`)}</h3><p${ctx.k(`${b}.body`)}>${ctx.v(`${b}.body`)}</p></div><span class="timeline-place"${ctx.k(`${b}.place`)}>${ctx.v(`${b}.place`)}</span></article>`;
    })
    .join('\n');

  return `    <section class="section" id="experience" data-od-id="experience-section">
      <div class="container">
        ${title(ctx, 'experience', 'experience-heading')}
        <div class="timeline">
${rows}
        </div>
      </div>
    </section>`;
}

/* ────────────────────────────── 技术栈 ────────────────────────────── */
function stack(ctx, d) {
  const edu = d.stack.education
    .map((_, i) => `<div class="education-item" data-od-id="education-${e(d.stack.education[i].id)}"><strong${ctx.k(idx('stack.education', i, 'degree'))}>${ctx.v(idx('stack.education', i, 'degree'))}</strong><p${ctx.k(idx('stack.education', i, 'org'))}>${ctx.v(idx('stack.education', i, 'org'))}</p></div>`)
    .join('');

  const rows = d.stack.groups
    .map((g, i) => `          <div class="stack-row"><h3${ctx.k(idx('stack.groups', i, 'label'))}>${ctx.v(idx('stack.groups', i, 'label'))}</h3><p>${et(g.items)}</p></div>`)
    .join('\n');

  return `    <section class="section" id="stack" data-od-id="stack-section">
      <div class="container stack-layout">
        <div class="section-title"><p class="eyebrow"${ctx.k('stack.eyebrow')}>${ctx.v('stack.eyebrow')}</p><h2 data-od-id="stack-heading"${ctx.k('stack.heading')}>${ctx.v('stack.heading')}</h2><p${ctx.k('stack.lead')}>${ctx.v('stack.lead')}</p><div class="education" style="margin-top:32px">${edu}</div></div>
        <div class="stack-groups">
${rows}
        </div>
      </div>
    </section>`;
}

/* ─────────────────────────────── 联系 ─────────────────────────────── */
function contact(ctx, d) {
  return `    <section class="section" id="contact" data-od-id="contact-section">
      <div class="container contact">
        <div class="contact-intro">
          <p class="eyebrow"${ctx.k('contact.eyebrow')}>${ctx.v('contact.eyebrow')}</p>
          <h2 data-od-id="contact-heading"${ctx.k('contact.heading')}>${ctx.v('contact.heading')}</h2>
          <p${ctx.k('contact.lead')}>${ctx.v('contact.lead')}</p>
          <div class="contact-links"><a class="btn btn-primary" href="mailto:${e(d.contact.email)}" data-od-id="email-cta"${ctx.k('contact.cta')}>${ctx.v('contact.cta')}</a></div>
        </div>
        <div class="social-grid" id="social-grid" data-od-id="social-grid"${ctx.attr('aria-label', 'ui.social_label')}></div>
        <p class="social-status" id="social-status" role="status" aria-live="polite"></p>
      </div>
    </section>`;
}

/* 通用小节标题 */
function title(ctx, key, odId) {
  return `<div class="section-title"><p class="eyebrow"${ctx.k(`${key}.eyebrow`)}>${ctx.v(`${key}.eyebrow`)}</p><h2 data-od-id="${odId}"${ctx.k(`${key}.heading`)}>${ctx.v(`${key}.heading`)}</h2><p${ctx.k(`${key}.lead`)}>${ctx.v(`${key}.lead`)}</p></div>`;
}
