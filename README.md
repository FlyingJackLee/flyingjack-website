# flyingjack-website

个人作品集站点。内容由 `data/site.yaml` 驱动，构建产出静态 HTML，推送到 main 自动部署到
GitHub Pages（`resume.flyingjack.top`）。

```
npm install
npm run dev        # http://localhost:4173，改 data/ 或 src/ 自动重建
npm run build      # 生成 dist/
npm run verify     # 与设计稿做 DOM 同构校验
```

## 改内容

只改 `data/site.yaml`。它是站点的唯一数据源，按网页设计建模，和简历无关。

每个面向读者的字段都是 `{zh, en}` 成对的，构建时自动获得一个路径键（如 `hero.lead`），
中文渲染进 HTML，英文放进页面内嵌的 JSON，点 EN 按键查表替换。

**两条铁律：**

1. **中文字符串必须写在一行内。** YAML 的折叠标量 `>-` 会把换行变成空格，中文不需要
   空格，会被静默插入。英文可以放心折行。
2. **流式映射 `{ }` 里含英文逗号的值要加引号。** 否则逗号会被当成键值对分隔符，
   把一个字符串切成好几个野键。

这两条 `npm run build` 都会检测并报错，但知道原因能省时间。

### 常见改动

| 想做什么 | 改哪里 |
|---|---|
| 换首屏文案 | `hero.lead` / `hero.role` / `hero.note` |
| 加一个项目 | `projects.items` 追加一项，`slug` 决定详情页地址 |
| 改项目分类 | `projects.items[].category`，值必须出现在 `projects.filters` 里 |
| 补案例正文 | `projects.items[].case[].body` / `.items` / `.links` |
| 填社交账号 | `contact.socials`，`value` 为空的卡片不渲染；有 `value` 无 `href` 则点击复制 |
| 换头像 | 替换 `assets/profile-source.png`，重新生成下面两个派生文件 |
| 换简历 | 替换 `assets/resume.zh.pdf` / `assets/resume.en.pdf`，文件名不变则无需改配置 |

### 重新生成头像

图片在本地生成并提交进仓库，CI 不需要图像工具。

```sh
sips --resampleWidth 900 assets/profile-source.png --out /tmp/p.png
sips -s format jpeg -s formatOptions 78 /tmp/p.png --out assets/profile-900.jpg
cwebp -q 82 /tmp/p.png -o assets/profile-900.webp
```

尺寸依据：桌面最大显示 340px 宽，手机 280px；3 倍屏手机需要 840px，故取 900px。

## 样式

`src/styles.css` 与 `developer-portfolio-structure-v2.html` 里的 `<style>` 块
**逐字节相同**，`npm run verify` 会校验这一点。**不要往里面加任何东西。**

新增样式一律写在 `src/site.css`。

`developer-portfolio-structure-v2.html` 是原始设计稿，作为校验基准留在仓库里，
不参与构建，别删。

## 校验

`npm run verify` 做四件事：

1. 把设计稿和 `dist/index.html` 解析成节点树，逐节点比对
2. 对照 `verify.js` 顶部声明的预期差异清单，出现任何未声明的差异即失败
3. 校验 `styles.css` 与设计稿 `<style>` 逐字节一致
4. 检查 5 个详情页的结构完整性和翻译键是否全部命中

CI 在每次部署前跑一遍。改了模板之后本地先跑它。

## 部署

推送到 `main` 触发 `.github/workflows/deploy.yml`：安装依赖 → 构建 → 校验 → 发布到
GitHub Pages。校验不过就不发布。

### 首次配置

1. **DNS** 加一条记录：`resume` CNAME → `flyingjacklee.github.io.`
2. **仓库 Settings → Pages** → Source 选 GitHub Actions，Custom domain 填
   `resume.flyingjack.top`，等 DNS 校验通过后勾上 **Enforce HTTPS**
3. 构建产物里的 `CNAME` 文件由 `build.js` 自动写入（内容取自 `site.domain`）。
   **别删这段逻辑**，否则每次部署都会把 GitHub Pages 的域名设置冲掉。

## 待补

`npm run build` 会列出还没写正文的案例小节。当前有 3 处：

- `llm-gateway` / 部署形态与扩展方向
- `expert-engine` / 结构化输出与错误处理
- `warehouse` / 单体到微服务的演进

没写的小节不会渲染，不影响上线。

## 简历 PDF

首屏档案卡底部的简历链接是**语言相关**的：中文访客拿 `assets/resume.zh.pdf`，
英文访客拿 `assets/resume.en.pdf`。配置在 `hero.note.link.href`，是个 `{zh, en}` 对，
通过 `data-i18n-attr="href:..."` 在切语言时一并替换。

整个 `link` 节点删掉则链接不渲染。
