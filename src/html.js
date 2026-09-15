// 极简 HTML 解析器。只需应付本仓库这两份格式良好的文档，不追求通用。

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea']);

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: '\u00a0' };
const decode = (s) => s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, k) =>
  ENT[k.toLowerCase()] ?? (k[0] === '#'
    ? String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : +k.slice(1))
    : m));

export function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  let i = 0;

  const push = (node) => stack[stack.length - 1].children.push(node);
  const addText = (s) => {
    const t = s.replace(/\s+/g, ' ').trim();
    if (t) push({ text: decode(t) });
  };

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { addText(html.slice(i)); break; }
    addText(html.slice(i, lt));

    if (html.startsWith('<!--', lt)) { i = html.indexOf('-->', lt) + 3; continue; }
    if (html.startsWith('<!', lt)) { i = html.indexOf('>', lt) + 1; continue; }

    if (html[lt + 1] === '/') {
      const gt = html.indexOf('>', lt);
      const tag = html.slice(lt + 2, gt).trim().toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tag === tag) { stack.length = k; break; }
      }
      i = gt + 1;
      continue;
    }

    // 开标签：逐字符扫描，正确处理属性值里的 >
    let j = lt + 1, inQ = null;
    while (j < html.length) {
      const c = html[j];
      if (inQ) { if (c === inQ) inQ = null; }
      else if (c === '"' || c === "'") inQ = c;
      else if (c === '>') break;
      j++;
    }
    const inner = html.slice(lt + 1, j);
    const selfClose = inner.endsWith('/');
    const src = selfClose ? inner.slice(0, -1) : inner;
    const tag = src.match(/^[^\s/>]+/)[0].toLowerCase();

    const attrs = {};
    const re = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    re.lastIndex = tag.length;
    let m;
    while ((m = re.exec(src))) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');

    const node = { tag, attrs, children: [] };
    push(node);
    i = j + 1;

    if (VOID.has(tag) || selfClose) continue;
    if (RAW.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, i);
      node.raw = html.slice(i, end === -1 ? html.length : end);
      i = end === -1 ? html.length : html.indexOf('>', end) + 1;
      continue;
    }
    stack.push(node);
  }
  return root;
}

export function find(node, pred) {
  if (node.tag && pred(node)) return node;
  for (const c of node.children ?? []) {
    const r = find(c, pred);
    if (r) return r;
  }
  return null;
}

export function findAll(node, pred, out = []) {
  if (node.tag && pred(node)) out.push(node);
  for (const c of node.children ?? []) findAll(c, pred, out);
  return out;
}

export const hasClass = (n, c) => (n.attrs?.class ?? '').split(/\s+/).includes(c);
