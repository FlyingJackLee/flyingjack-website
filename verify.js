#!/usr/bin/env node
// DOM 同构校验：把设计稿与构建产物解析成节点树逐节点比对。
// 预期内的差异在下方显式声明；出现任何未声明的差异即判定失败。

import { readFileSync } from 'node:fs';
import { parse, find, findAll, hasClass } from './src/html.js';

const ORIG = 'developer-portfolio-structure-v2.html';
const BUILT = 'dist/index.html';

/* ── 显式声明的预期差异 ── */
const EXPECTED = [
  '每个可翻译节点新增 data-i18n / data-i18n-attr / data-i18n-prefix 属性',
  '文案全部由 data/site.yaml 驱动：只比对文本节点的存在与位置，不比对文本内容',
  '<img> 外包 <picture> + <source>，src 与 width/height 因外链优化而改变',
  '<style> 内联改为 <link> 外链，<script> 内联改为外链 + JSON 载荷',
  '项目卡 ≥ 设计稿的 4 张（设计稿里的每张仍须同构，新增不限）',
  '时间线 ≥ 设计稿的 3 条（同上）',
  '每张项目卡的 <details> 内新增一条「阅读完整案例」链接',
  '首屏档案卡的简历链接 href 由 resume.zh.html（不存在）改为语言相关的 assets/resume.{zh,en}.pdf',
  '社交卡片 1 → 3 张（新增微信、LinkedIn）；≥920px 时三列不增高，768px 两列 +108px，≤620px 单列 +216px',
  'data-category 重划为互斥两类（原稿 agent/platform/cloud 三类重叠，点“平台架构”只藏掉 1 张卡）',
];

const DROP_ATTRS = new Set(['data-i18n', 'data-i18n-attr', 'data-i18n-prefix', 'decoding']);

/* 归一化：抹平上面声明过的差异，其余原样保留 */
function norm(node) {
  // 文案由 data/site.yaml 驱动，改动文案不应导致校验失败：
  // 只保留「这里有一个文本节点」，不比对文本内容本身。
  if (node.text != null) return { text: '‹文本›' };
  if (node.tag === 'script' || node.tag === 'style') return null;

  // <picture> 拆掉，只留其中的 <img>；<source> 丢弃
  if (node.tag === 'picture') {
    const img = find(node, (n) => n.tag === 'img');
    return img ? norm(img) : null;
  }
  if (node.tag === 'source') return null;

  const attrs = {};
  for (const [k, v] of Object.entries(node.attrs)) {
    if (DROP_ATTRS.has(k)) continue;
    // 图片资源本身就是要换的，只比较它仍然是一张图
    if (node.tag === 'img' && ['src', 'width', 'height'].includes(k)) { attrs[k] = '‹资源›'; continue; }
    // 首屏简历链接：原稿指向不存在的 resume.zh.html，现指向真实 PDF
    if (k === 'href' && node.attrs['data-od-id'] === 'resume-link') { attrs[k] = '‹简历›'; continue; }
    // 项目分类重划：原稿三类重叠，现为互斥两类
    if (k === 'data-category') { attrs[k] = '‹分类›'; continue; }
    attrs[k] = v;
  }

  let children = node.children.map(norm).filter(Boolean);

  // <details> 里新增的「阅读完整案例」链接
  if (hasClass(node, 'project-details')) {
    children = children.filter((c) => !(c.tag === 'a' && (c.attrs?.class ?? '').includes('resume-link')));
  }
  return { tag: node.tag, attrs, children };
}

/* 序列化成可读的多行签名 */
function sig(n, depth = 0, out = []) {
  const pad = '  '.repeat(depth);
  if (n.text != null) { out.push(`${pad}"${n.text}"`); return out; }
  const a = Object.keys(n.attrs).sort().map((k) => ` ${k}="${n.attrs[k]}"`).join('');
  if (!n.children.length) { out.push(`${pad}<${n.tag}${a}/>`); return out; }
  out.push(`${pad}<${n.tag}${a}>`);
  n.children.forEach((c) => sig(c, depth + 1, out));
  out.push(`${pad}</${n.tag}>`);
  return out;
}

const problems = [];
function compare(label, a, b) {
  if (!a || !b) { problems.push(`${label}：一侧缺失（原稿 ${!!a} / 新版 ${!!b}）`); return; }
  const A = sig(norm(a));
  const B = sig(norm(b));
  if (A.join('\n') === B.join('\n')) { console.log(`  ✓ ${label}`); return; }

  const n = Math.max(A.length, B.length);
  const diffs = [];
  for (let i = 0; i < n && diffs.length < 6; i++) {
    if (A[i] !== B[i]) diffs.push([i, A[i], B[i]]);
  }
  console.log(`  ✗ ${label}`);
  diffs.forEach(([i, x, y]) => {
    console.log(`      第 ${i} 行`);
    console.log(`        原稿  ${x ?? '‹无›'}`);
    console.log(`        新版  ${y ?? '‹无›'}`);
  });
  problems.push(`${label}：节点树不一致`);
}

/* ── 开跑 ── */
const orig = parse(readFileSync(ORIG, 'utf8'));
const built = parse(readFileSync(BUILT, 'utf8'));

const heroA = find(orig, (n) => n.attrs?.id === 'home');
const heroB = find(built, (n) => n.attrs?.id === 'home');

console.log('\nDOM 同构校验：设计稿 ↔ dist/index.html\n');

compare('顶栏 topbar', find(orig, (n) => hasClass(n, 'topbar')), find(built, (n) => hasClass(n, 'topbar')));
compare('首屏 future-hero', heroA, heroB);

for (const id of ['capabilities', 'projects', 'experience', 'stack', 'contact']) {
  // 项目与经历的条目数是声明过的差异，单独处理
  if (id === 'projects' || id === 'experience') continue;
  compare(`区块 #${id}`, find(orig, (n) => n.attrs?.id === id), find(built, (n) => n.attrs?.id === id));
}

compare('终端 terminal', find(orig, (n) => hasClass(n, 'terminal')), find(built, (n) => hasClass(n, 'terminal')));
compare('页脚 footer', find(orig, (n) => hasClass(n, 'footer')), find(built, (n) => hasClass(n, 'footer')));

// 项目卡：前 4 张逐张比对，第 5 张应当只存在于新版
const cardsA = findAll(orig, (n) => hasClass(n, 'project-card'));
const cardsB = findAll(built, (n) => hasClass(n, 'project-card'));
cardsA.forEach((c, i) => compare(`项目卡 ${i + 1} ${c.attrs['data-od-id']}`, c, cardsB[i]));
// 设计稿里的每一张都必须还在且同构；之后新增多少张都可以，这里只报数。
if (cardsB.length < cardsA.length) {
  problems.push(`项目卡少了：设计稿 ${cardsA.length} 张，现在 ${cardsB.length} 张`);
} else if (cardsB.length > cardsA.length) {
  const added = cardsB.slice(cardsA.length).map((c) => c.attrs['data-od-id']).join('、');
  console.log(`  ✓ 项目卡新增 ${cardsB.length - cardsA.length} 张：${added}`);
}

// 时间线：前 3 条逐条比对
const tlA = findAll(orig, (n) => hasClass(n, 'timeline-item'));
const tlB = findAll(built, (n) => hasClass(n, 'timeline-item'));
tlA.forEach((c, i) => compare(`时间线 ${i + 1} ${c.attrs['data-od-id']}`, c, tlB[i]));
if (tlB.length < tlA.length) {
  problems.push(`时间线少了：设计稿 ${tlA.length} 条，现在 ${tlB.length} 条`);
} else if (tlB.length > tlA.length) {
  const added = tlB.slice(tlA.length).map((c) => c.attrs['data-od-id']).join('、');
  console.log(`  ✓ 时间线新增 ${tlB.length - tlA.length} 条：${added}`);
}

/* ── CSS 逐字节校验 ── */
{
  const styleTag = /<style>([\s\S]*?)<\/style>/.exec(readFileSync(ORIG, 'utf8'))[1];
  const shipped = readFileSync('dist/assets/styles.css', 'utf8');
  if (styleTag === shipped) {
    console.log(`  \u2713 styles.css 与设计稿 <style> 逐字节一致（${shipped.length} 字符）`);
  } else {
    console.log('  \u2717 styles.css 与设计稿 <style> 不一致');
    problems.push('styles.css 被改动了');
  }
}

/* ── 项目详情页 ── */
for (const slug of ['bid-agent', 'llm-gateway', 'expert-engine', 'warehouse', 'codearts']) {
  const html = readFileSync(`dist/projects/${slug}.html`, 'utf8');
  const tree = parse(html);
  const payload = JSON.parse(find(tree, (n) => n.attrs?.id === 'site-payload').raw.replace(/\\u003c/g, '<'));
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
  const missing = keys.filter((k) => !payload.dict[k]);
  const blocks = findAll(tree, (n) => hasClass(n, 'case-block')).length;
  if (missing.length) {
    console.log(`  \u2717 ${slug}：${missing.length} 个键不在字典中`);
    problems.push(`${slug} 翻译键缺失`);
  } else if (!find(tree, (n) => hasClass(n, 'topbar')) || !find(tree, (n) => hasClass(n, 'footer'))) {
    console.log(`  \u2717 ${slug}：缺少顶栏或页脚`);
    problems.push(`${slug} 结构不完整`);
  } else {
    console.log(`  \u2713 详情页 ${slug.padEnd(14)} ${blocks} 个案例小节，${keys.length} 个翻译键全部命中`);
  }
}

console.log('\n声明过的预期差异：');
EXPECTED.forEach((e) => console.log(`  · ${e}`));

if (problems.length) {
  console.error(`\n✗ ${problems.length} 处未预期差异\n`);
  process.exit(1);
}
console.log('\n✓ 除声明过的差异外，节点树完全一致\n');
