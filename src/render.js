// 渲染核心：把 {zh, en} 数据变成「中文 HTML + data-i18n 路径键 + 翻译字典」

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);      // 属性值
export const escText = (s) => String(s).replace(/[&<>]/g, (c) => ESC[c]);   // 文本节点

export class Ctx {
  constructor(data, { prefix = '' } = {}) {
    this.data = data;
    this.prefix = prefix;   // 相对路径前缀，详情页为 '../'
    this.dict = {};         // path -> {zh, en}
    this.errors = [];
  }

  // 取一个 {zh, en} 节点，登记进字典，返回中文原文
  #pair(path) {
    const node = path.split('.').reduce((o, k) => (o == null ? o : o[k]), this.data);
    if (node == null) {
      this.errors.push(`路径不存在：${path}`);
      return { zh: '', en: '' };
    }
    const keys = Object.keys(node);
    if (keys.length !== 2 || !keys.includes('zh') || !keys.includes('en')) {
      this.errors.push(`${path} 不是合法的 {zh, en} 对，实际键：${keys.join(', ')}`);
      return { zh: node.zh ?? '', en: node.en ?? '' };
    }
    for (const lang of ['zh', 'en']) {
      const v = node[lang];
      if (typeof v !== 'string' || !v.trim()) {
        this.errors.push(`${path}.${lang} 不是非空字符串`);
      }
    }
    // YAML 折叠标量陷阱：中文串里出现紧贴汉字的空格
    const CJK = '\\u4e00-\\u9fff\\u3000-\\u303f\\uff00-\\uffef';
    if (new RegExp(`[${CJK}] +[${CJK}]`).test(node.zh)) {
      this.errors.push(
        `${path}.zh 的汉字之间出现空格，多半是用了 >- 折叠标量。中文请写成一行：\n      「${node.zh}」`);
    }
    this.dict[path] = { zh: node.zh, en: node.en };
    return node;
  }

  // 文本：返回已转义的中文
  v(path) { return escText(this.#pair(path).zh); }

  // 属性：data-i18n 键（含前导空格）
  k(path) { return ` data-i18n="${esc(path)}"`; }

  // 文本 + 键，一次调用（最常用）
  t(path) { const p = this.#pair(path); return { a: ` data-i18n="${esc(path)}"`, v: escText(p.zh) }; }

  // 属性型翻译：alt / aria-label 等
  attr(name, path) {
    const p = this.#pair(path);
    return ` ${name}="${esc(p.zh)}" data-i18n-attr="${esc(name)}:${esc(path)}"`;
  }

  // 只登记进字典、不输出 data-i18n：用于 JS 全权接管的节点（三个切换按钮）
  own(name, path) { return ` ${name}="${esc(this.#pair(path).zh)}"`; }

  // 资源与链接路径
  url(p) { return esc(this.prefix + p); }
}

// 数组路径辅助：ctx.t(idx('projects.items', i, 'title'))
export const idx = (base, i, ...rest) => [base, i, ...rest].join('.');
