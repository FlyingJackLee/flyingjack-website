# flyingjack-website

个人作品集站点，已上线：**https://resume.flyingjack.top/**

内容由 `data/site.yaml` 驱动，构建产出静态 HTML，推送到 `main` 自动部署到 GitHub Pages。

```
npm install
npm run dev        # http://localhost:4173，改 data/ 或 src/ 自动重建
npm run build      # 生成 dist/
npm run verify     # 与设计稿做 DOM 同构校验
```

## 项目结构

```
data/site.yaml       站点唯一数据源 —— 改内容只动这里
src/
  styles.css         与设计稿 <style> 逐字节一致，禁止修改
  site.css           所有新增与覆盖样式都写在这里
  app.js             客户端：主题、语言、菜单、筛选、终端、社交卡片
  render.js          i18n 路径键收集 + HTML 转义
  html.js            校验用的极简 HTML 解析器
  templates/         layout / index / project
build.js             构建 + 数据校验
verify.js            DOM 同构校验
serve.js             本地预览（零依赖）
developer-portfolio-structure-v2.html   原始设计稿，校验基准，不参与构建，别删
resume.yaml          简历源文件，上游系统导出，不参与构建
dist/                构建产物，.gitignore
```

依赖只有 `yaml` 一个（零传递依赖）。

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
   （**只比结构，不比文案**：文案归 `data/site.yaml` 管，改文案不该让校验失败；
   文本节点的存在与位置仍然比对，所以删段落、丢节点照样会被拦下）
2. 对照 `verify.js` 顶部声明的预期差异清单，出现任何未声明的差异即失败
3. 校验 `styles.css` 与设计稿 `<style>` 逐字节一致
4. 检查各详情页的结构完整性和翻译键是否全部命中

**项目卡和时间线是「只增不减」**：设计稿里原有的 4 张卡 / 3 条经历必须还在且逐节点同构，
在此之后新增多少都可以，校验只会报个数。所以往 `site.yaml` 里加项目、加经历不会被拦下。

改了 `src/templates/` 或 `src/site.css` 之后，本地先跑一次 `npm run verify` 再推。
纯改 `data/site.yaml` 的话 CI 里那道校验也能兜住。

CI 在每次部署前跑一遍。改了模板之后本地先跑它。

## 部署

### 日常：改内容并上线

```sh
vim data/site.yaml          # 改内容
npm run build && npm run verify   # 本地自查（可选，CI 里也会跑）
git add -A
git commit -m "更新 xxx"
git push
```

推送到 `main` 就会触发 `.github/workflows/deploy.yml`：

```
npm ci → npm run build → npm run verify → upload-pages-artifact → deploy-pages
```

**校验不过就不发布**。整个流程约 1 分钟。

### 看部署状态

```sh
gh run list --limit 3                  # 最近几次运行
gh run watch                           # 盯着当前这次跑完
gh run view <run-id> --log-failed      # 失败时看日志
```

网页版：https://github.com/FlyingJackLee/flyingjack-website/actions

### 手动触发部署

workflow 带了 `workflow_dispatch`，不改代码也能重新发一次：

```sh
gh workflow run "Deploy to GitHub Pages"   # 手动跑一次
gh run rerun <run-id> --failed             # 只重跑失败的任务
```

网页版：Actions → Deploy to GitHub Pages → Run workflow。

### ⚠️ 代理环境下 SSH 推不上去

这台机器的代理把 `github.com:22` 劫持到 `198.18.x.x` 后直接断开，
`git push` 会报 `Connection closed by 198.18.0.81 port 22`。

本仓库的 remote 已经改走 GitHub 的 443 端口入口：

```
ssh://git@ssh.github.com:443/FlyingJackLee/flyingjack-website.git
```

想让所有仓库都这样，在 `~/.ssh/config` 加：

```
Host github.com
  HostName ssh.github.com
  Port 443
```

### 部署环境的既有配置（已配好，仅供排查/重建）

| 项 | 值 |
|---|---|
| 仓库 | `FlyingJackLee/flyingjack-website`（公开） |
| Pages 来源 | GitHub Actions（`build_type: workflow`） |
| 自定义域名 | `resume.flyingjack.top` |
| DNS | `resume` CNAME → `flyingjacklee.github.io.` |
| HTTPS | 已强制 |

当初是用这几条命令配的，需要重建时照抄：

```sh
gh api -X POST repos/FlyingJackLee/flyingjack-website/pages -f build_type=workflow
gh api -X PUT  repos/FlyingJackLee/flyingjack-website/pages -f cname=resume.flyingjack.top
gh api -X PUT  repos/FlyingJackLee/flyingjack-website/pages -F https_enforced=true
gh api repos/FlyingJackLee/flyingjack-website/pages          # 查当前配置
```

**`CNAME` 文件由 `build.js` 写进产物**（内容取自 `site.domain`）。别删那段逻辑——
用 Actions 部署时，产物里没有 CNAME 会把网页上设的自定义域名冲掉，站点会自己掉线。

### 部署后验证

```sh
curl -sI https://resume.flyingjack.top/ | head -3
curl -s https://resume.flyingjack.top/CNAME          # 应输出 resume.flyingjack.top
```

## 简历 PDF

首屏档案卡底部的简历链接是**语言相关**的：中文访客拿 `assets/resume.zh.pdf`，
英文访客拿 `assets/resume.en.pdf`。配置在 `hero.note.link.href`，是个 `{zh, en}` 对，
通过 `data-i18n-attr="href:..."` 在切语言时一并替换。

整个 `link` 节点删掉则链接不渲染。
