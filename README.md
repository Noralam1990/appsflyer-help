# AppsFlyer Help

一个面向新手和不同岗位的 AppsFlyer 学习知识库，包含：

- `appsflyer-learning-notes/`：按主题整理的 Markdown 笔记
- `appsflyer-learning-site/`：可直接打开的静态学习网页
- `server.mjs`：本地 AI 问答代理，避免把模型 API Key 暴露在浏览器里

## 本地运行 AI 问答

```bash
export OPENAI_API_KEY="你的 OpenAI API Key"
npm start
```

然后打开：

```text
http://localhost:8787
```

可选配置：

```bash
export OPENAI_MODEL="gpt-5.4-mini"
export PORT=8787
```

## 重新生成网页数据

```bash
npm run build:docs
```

## 生成 SEO 文件

默认会以正式域名 `https://appsflyerhelp.tech/` 生成 canonical、`robots.txt` 和 `sitemap.xml`：
同时会生成 `llms.txt`，并保留 `llm.txt` 作为兼容别名。

```bash
npm run build:seo
```

如果你部署在自定义域名或其他路径，先传入正式 URL：

```bash
SITE_URL="https://your-domain.example/" npm run build:seo
```

## Vercel 数据监测

站点已在 `index.html` 接入 Vercel Web Analytics 静态脚本。
上线收数前，需要在 Vercel 项目的 Analytics 面板中启用 Web Analytics，并重新部署一次。
如果 Vercel 面板给出的是专属 `/<unique-path>/script.js`，把 `index.html` 里的脚本地址替换成面板展示的地址。

本地 `file://` 预览不会产生线上访问统计。
