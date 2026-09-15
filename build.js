#!/usr/bin/env node
// 从 data/site.yaml 生成整站。任何数据问题都在这里变成构建失败，而不是线上静默出错。

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { Ctx } from './src/render.js';
import { layout } from './src/templates/layout.js';
import { indexBody } from './src/templates/index.js';
import { projectBody } from './src/templates/project.js';

const OUT = 'dist';
const data = YAML.parse(readFileSync('data/site.yaml', 'utf8'));
const problems = [];

/* ── 数据层面的前置校验 ── */
const filterIds = new Set(data.projects.filters.map((f) => f.id));
const slugs = new Set();
data.projects.items.forEach((p, i) => {
  if (!p.slug) problems.push(`projects.items.${i} 缺少 slug`);
  if (slugs.has(p.slug)) problems.push(`slug 重复：${p.slug}`);
  slugs.add(p.slug);
  p.category.forEach((c) => {
    if (!filterIds.has(c)) {
      problems.push(`projects.items.${i} (${p.slug}) 的分类 "${c}" 不在 filters 中，首页筛选会漏掉它`);
    }
  });
});
if (data.hero.photo?.webp) {
  for (const f of [data.hero.photo.webp, data.hero.photo.jpg]) {
    try { readFileSync(f); } catch { problems.push(`图片不存在：${f}`); }
  }
}

/* ── 渲染 ── */
const write = (rel, text) => {
  const path = join(OUT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

// JS 侧需要但 HTML 里不出现的 ui.* 键，全部强制登记
const registerUi = (ctx) => Object.keys(data.ui).forEach((k) => ctx.v(`ui.${k}`));

function buildPage({ rel, prefix, body, meta, extras }) {
  const ctx = new Ctx(data, { prefix });
  registerUi(ctx);
  const bodyHtml = body(ctx);
  const html = layout(ctx, { bodyHtml, extraCss: ['assets/site.css'], meta: meta(ctx) });
  problems.push(...ctx.errors);

  const payload = {
    defaultLang: data.site.default_lang,
    dict: ctx.dict,
    meta: meta(ctx),
    socials: data.contact.socials,
    terminal: extras?.terminal ? data.terminal.steps : null,
  };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const out = html.replace('__PAYLOAD__', json);

  // HTML 里出现的每个键都必须在字典里
  for (const m of out.matchAll(/data-i18n="([^"]+)"/g)) {
    if (!ctx.dict[m[1]]) problems.push(`${rel}: data-i18n="${m[1]}" 在字典中不存在`);
  }
  for (const m of out.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) {
      const key = pair.split(':')[1];
      if (key && !ctx.dict[key]) problems.push(`${rel}: data-i18n-attr 引用了不存在的键 ${key}`);
    }
  }

  write(rel, out);
  return out;
}

const pages = [];

pages.push([ 'index.html', buildPage({
  rel: 'index.html',
  prefix: '',
  body: indexBody,
  meta: () => ({ title: data.site.title, description: data.site.description }),
  extras: { terminal: true },
})]);

data.projects.items.forEach((p, i) => {
  const rel = `projects/${p.slug}.html`;
  pages.push([ rel, buildPage({
    rel,
    prefix: '../',
    body: (ctx) => projectBody(ctx, i),
    meta: () => ({
      title: { zh: `${p.title.zh}｜${data.site.title.zh.split('｜')[0]}`,
               en: `${p.title.en} | ${data.site.title.en.split('|')[0].trim()}` },
      description: p.blurb,
    }),
  })]);
});

/* ── 静态资源 ── */
const assets = [
  ['src/styles.css', 'assets/styles.css'],
  ['src/site.css', 'assets/site.css'],
  ['src/app.js', 'assets/app.js'],
  [data.hero.photo.webp, data.hero.photo.webp],
  [data.hero.photo.jpg, data.hero.photo.jpg],
];
// 简历 PDF（语言相关），以及任何 data 里引用到的本地文件
for (const f of Object.values(data.hero.note.link?.href ?? {})) {
  if (f && !/^https?:/.test(f)) {
    try { readFileSync(f); assets.push([f, f]); }
    catch { problems.push(`简历文件不存在：${f}`); }
  }
}
if (problems.length === 0) {
  rmSync(OUT, { recursive: true, force: true });
  pages.forEach(([rel, html]) => write(rel, html));
  assets.forEach(([from, to]) => {
    mkdirSync(dirname(join(OUT, to)), { recursive: true });
    copyFileSync(from, join(OUT, to));
  });
  // 自定义域名。缺了它每次部署都会把 GitHub Pages 的域名设置冲掉。
  write('CNAME', data.site.domain + '\n');
  write('.nojekyll', '');
}

/* ── 结果 ── */
if (problems.length) {
  console.error('\n构建失败：\n');
  [...new Set(problems)].forEach((p) => console.error('  ✗ ' + p));
  console.error('');
  process.exit(1);
}

const sizes = pages.map(([rel, html]) => `  ${rel.padEnd(34)} ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
console.log('\n构建完成 → dist/\n');
console.log(sizes.join('\n'));
console.log(`  自定义域名  ${data.site.domain}`);
console.log(`  项目详情页  ${data.projects.items.length} 篇`);
const todo = data.projects.items.flatMap((p) =>
  p.case.filter((s) => !s.body && !s.items && !s.links).map((s) => `${p.slug} / ${s.heading.zh}`));
if (todo.length) {
  console.log(`\n  未撰写的案例小节 ${todo.length} 处（不会渲染）：`);
  todo.forEach((t) => console.log(`    · ${t}`));
}
console.log('');
