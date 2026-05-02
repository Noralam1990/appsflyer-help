import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const siteDir = join(__dirname, "appsflyer-learning-site");
const port = Number(process.env.PORT || 8787);
const openAiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const openAiModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (requestUrl.pathname === "/api/ask") {
      await handleAsk(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(requestUrl.pathname, req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`AppsFlyer learning site: http://localhost:${port}`);
  console.log("AI endpoint: POST /api/ask");
});

async function handleAsk(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, {
      error: "Missing OPENAI_API_KEY. Set it in your terminal before starting the server.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const question = String(body.question || "").trim();
  if (!question) {
    sendJson(res, 400, { error: "Question is required" });
    return;
  }

  const context = Array.isArray(body.context) ? body.context.slice(0, 6) : [];
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const activeDoc = body.activeDoc || null;

  const prompt = buildPrompt({ question, context, history, activeDoc });
  const response = await fetch(`${openAiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      instructions: buildInstructions(),
      input: prompt,
      max_output_tokens: 1400,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    sendJson(res, response.status, {
      error: data.error?.message || `OpenAI API request failed with ${response.status}`,
    });
    return;
  }

  sendJson(res, 200, {
    answer: extractOutputText(data) || "模型没有返回可显示的文本。",
    model: data.model || openAiModel,
    usage: data.usage || null,
  });
}

async function serveStatic(pathname, req, res) {
  let cleanPath = decodeURIComponent(pathname);
  if (cleanPath === "/") cleanPath = "/index.html";
  if (cleanPath.startsWith("/appsflyer-learning-site/")) {
    cleanPath = cleanPath.replace("/appsflyer-learning-site", "") || "/index.html";
  }

  const normalizedPath = normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  const targetPath = join(siteDir, normalizedPath);

  if (!targetPath.startsWith(siteDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const fileStat = await stat(targetPath);
    if (!fileStat.isFile()) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
  } catch {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const ext = extname(targetPath);
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(targetPath).pipe(res);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200_000) {
      throw new Error("Request body is too large");
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function buildInstructions() {
  return [
    "你是一个中文 AppsFlyer 学习教练，帮助用户深入理解 AppsFlyer、移动归因、SKAN、OneLink、报表、BI 对账、增长和开发集成。",
    "优先使用用户知识库上下文回答；如果要补充通用大模型知识，明确标注为“延伸理解”，并提醒以官方文档或当前账户配置为准。",
    "不要假装实时联网，不要编造页面更新时间、价格、套餐、账户权限或最新政策。",
    "回答要适合学习：先给直接结论，再解释为什么，再给排查或实践步骤，最后列避坑点。",
    "如果问题模糊，先给一个可执行的默认学习路径，再说明还需要哪些信息。",
  ].join("\n");
}

function buildPrompt({ question, context, history, activeDoc }) {
  const knowledge = context
    .map((item, index) => {
      return [
        `片段 ${index + 1}`,
        `标题：${item.title || "未命名"}`,
        `文档 ID：${item.docId || "unknown"}`,
        `内容：${item.excerpt || ""}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `当前打开文档：${activeDoc?.title || "未知"}`,
    "",
    "最近对话：",
    history.map((item) => `${item.role}: ${item.content}`).join("\n") || "无",
    "",
    "知识库上下文：",
    knowledge || "没有检索到明确片段。",
    "",
    "用户问题：",
    question,
  ].join("\n");
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text.trim();

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
