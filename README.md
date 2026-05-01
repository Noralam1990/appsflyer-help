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
