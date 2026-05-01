const state = {
  activeDocId: null,
  query: "",
  role: "all",
  tocCollapsed: false,
  aiOpen: false,
  aiBusy: false,
  aiHistory: [],
};

const els = {
  nav: document.querySelector("#docNav"),
  content: document.querySelector("#content"),
  currentTitle: document.querySelector("#currentTitle"),
  eyebrow: document.querySelector("#eyebrow"),
  search: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  roleButtons: document.querySelectorAll(".role-pill"),
  tocPanel: document.querySelector("#tocPanel"),
  tocList: document.querySelector("#tocList"),
  expandAll: document.querySelector("#expandAll"),
  copyLink: document.querySelector("#copyLink"),
  aiToggle: document.querySelector("#aiToggle"),
  aiPanel: document.querySelector("#aiPanel"),
  aiClose: document.querySelector("#aiClose"),
  aiMessages: document.querySelector("#aiMessages"),
  aiForm: document.querySelector("#aiForm"),
  aiInput: document.querySelector("#aiInput"),
  aiSend: document.querySelector("#aiSend"),
  aiContextHint: document.querySelector("#aiContextHint"),
};

const roleLabels = {
  all: "全部",
  newbie: "新手",
  ua: "增长",
  product: "产品",
  data: "数据",
  dev: "开发",
  skan: "SKAN",
};

const docs = (window.APPSFLYER_DOCS || []).map((doc) => ({
  ...doc,
  searchText: `${doc.title}\n${doc.summary}\n${doc.markdown}`.toLowerCase(),
}));

const knowledgeChunks = buildKnowledgeChunks(docs);

const inlineTermNotes = {
  pid: "媒体源，用来识别哪个渠道带来流量",
  c: "Campaign 名称，用来识别活动",
  af_adset: "广告组名称，用来做 ad set 层级分析",
  af_ad: "广告或素材名称，用来做创意分析",
  af_c_id: "Campaign ID，适合稳定对账",
  af_adset_id: "广告组 ID，适合稳定对账",
  af_ad_id: "广告 ID，适合稳定对账",
  af_siteid: "Publisher 或站点 ID，排查渠道质量常用",
  af_sub1: "自定义扩展参数",
  af_sub5: "自定义扩展参数",
  af_click_lookback: "点击归因窗口",
  af_viewthrough_lookback: "曝光归因窗口",
  "is_retargeting=true": "标记这是再营销链接",
  deep_link_value: "App 内要打开的目标页面或场景值",
  af_dp: "URI scheme fallback",
  af_web_dp: "Web fallback URL",
  af_revenue: "收入字段，注意不要重复上报同一笔收入",
  is_primary_attribution: "主归因标识，用于处理 UA 与再营销重复口径",
  start: "SDK 启动方法，隐私方法调用顺序会影响数据",
};

const roadmapCards = [
  {
    id: "newbie",
    title: "新手通用路线",
    goal: "先建立地图感，听懂团队讨论，不被 dashboard 和术语淹没。",
    color: "peach",
    docs: ["glossary", "core-notes", "pitfalls", "role-roadmaps"],
    steps: [
      { name: "归因", desc: "先弄懂用户为什么归给某个渠道。", terms: ["organic", "non-organic", "install", "lookback window", "SRN"] },
      { name: "链接", desc: "再看增长链接如何决定数据粒度。", terms: ["OneLink", "pid", "c", "af_adset", "af_ad"] },
      { name: "事件", desc: "理解用户行为和收入怎么进入 AppsFlyer。", terms: ["in-app events", "revenue", "currency", "CUID", "S2S"] },
      { name: "报表", desc: "分清 LTV、Activity、Cohort。", terms: ["Overview", "Activity", "Events", "Cohort"] },
      { name: "专项", desc: "最后补 iOS、ROI、反作弊和人群。", terms: ["SKAN", "ROI360", "Protect360", "Audiences"] },
    ],
    outcomes: ["这个 install 为什么归给这个渠道", "为什么 AppsFlyer 和渠道后台数字不同", "为什么 LTV 和 Activity 不能混用"],
  },
  {
    id: "ua",
    title: "增长 / UA 路线",
    goal: "能开渠道、搭链接、看质量、做优化，而不是只盯 CPI。",
    color: "rose",
    docs: ["core-notes", "skan-ios-privacy", "data-reporting-api", "pitfalls"],
    steps: [
      { name: "开渠道", desc: "先确认 partner、权限、窗口、postback。", terms: ["Partner", "SRN", "postbacks", "permissions"] },
      { name: "上 Campaign", desc: "链接参数、命名、geo、OS、再营销标记。", terms: ["pid", "c", "af_siteid", "is_retargeting=true"] },
      { name: "看质量", desc: "用 cohort 和事件看用户质量。", terms: ["ROI", "retention", "event conversion", "fraud"] },
      { name: "iOS 优化", desc: "把 SKAN、SSOT、传统报表分开理解。", terms: ["SKAN", "SSOT", "Conversion Studio"] },
    ],
    outcomes: ["新渠道上线前要检查什么", "低 CPI 是否真的值得投", "iOS campaign 为什么慢且粗"],
  },
  {
    id: "product",
    title: "产品经理路线",
    goal: "把用户旅程、深链体验和事件定义连起来。",
    color: "lavender",
    docs: ["core-notes", "glossary", "pitfalls"],
    steps: [
      { name: "用户旅程", desc: "新用户、老用户、桌面用户各去哪。", terms: ["OneLink", "deep linking", "fallback"] },
      { name: "事件字典", desc: "定义真正代表激活和价值的事件。", terms: ["taxonomy", "funnel", "conversion", "engagement"] },
      { name: "再营销", desc: "明确哪些用户该触达，哪些要排除。", terms: ["Audiences", "exclusion", "Incrementality"] },
      { name: "口径评审", desc: "用 Activity、Events、Cohort 看产品动作。", terms: ["Activity", "Events", "Cohort"] },
    ],
    outcomes: ["点击链接后用户应该去哪里", "哪些事件代表真正激活", "哪些用户适合再营销"],
  },
  {
    id: "data",
    title: "数据分析路线",
    goal: "把 dashboard、raw data、API 和 BI 对账连成一条线。",
    color: "mint",
    docs: ["data-reporting-api", "glossary", "skan-ios-privacy", "pitfalls"],
    steps: [
      { name: "口径", desc: "先分清安装日、行为日、postback 到达日。", terms: ["LTV", "Activity", "Cohort", "timezone"] },
      { name: "明细", desc: "建 install、event、session、fraud 明细。", terms: ["Raw data", "Data Locker", "Pull API", "Push API"] },
      { name: "成本收入", desc: "把成本、IAP、订阅、广告收入接进来。", terms: ["ROI360", "Cost ETL", "ad revenue"] },
      { name: "iOS 去重", desc: "SKAN 和传统归因不要直接相加。", terms: ["SKAN", "SSOT", "privacy threshold"] },
    ],
    outcomes: ["为什么 dashboard 和 BI 不一致", "如何搭建 AppsFlyer 数仓", "如何处理 fraud 和 iOS 去重"],
  },
  {
    id: "dev",
    title: "开发工程师路线",
    goal: "保证 SDK、事件、深链、隐私和 S2S 数据稳定可信。",
    color: "butter",
    docs: ["core-notes", "data-reporting-api", "skan-ios-privacy", "pitfalls"],
    steps: [
      { name: "SDK", desc: "初始化、测试、版本和 release notes。", terms: ["iOS SDK", "Android SDK", "start"] },
      { name: "事件", desc: "事件名、参数、收入和币种要稳定。", terms: ["in-app events", "af_revenue", "currency", "CUID"] },
      { name: "深链", desc: "让链接真的打开 app 内正确页面。", terms: ["UDL", "deep_link_value", "Universal Links", "App Links"] },
      { name: "隐私/S2S", desc: "隐私方法、S2S、去重和错误监控。", terms: ["ATT", "S2S", "privacy methods"] },
    ],
    outcomes: ["SDK 是否真的上报成功", "事件为什么没出现在报表里", "深链为什么没有打开目标页"],
  },
  {
    id: "skan",
    title: "iOS / SKAN 专项路线",
    goal: "专门处理 ATT 后的 iOS 聚合归因、CV 设计和 SSOT。",
    color: "sky",
    docs: ["skan-ios-privacy", "data-reporting-api", "pitfalls"],
    steps: [
      { name: "隐私基础", desc: "先理解 ATT、IDFA、AAP 的边界。", terms: ["ATT", "IDFA", "AAP"] },
      { name: "CV 设计", desc: "把业务信号压进有限窗口。", terms: ["SKAN 4", "fine CV", "coarse CV", "lock window"] },
      { name: "配置联动", desc: "Conversion Studio、事件、partner mapping 一起检查。", terms: ["Conversion Studio", "postback", "mapping"] },
      { name: "解读", desc: "看 null、coarse、SSOT 和延迟。", terms: ["Null CV", "SSOT", "privacy threshold"] },
    ],
    outcomes: ["SKAN 为什么有延迟", "为什么大量 CV 是 null", "SKAN 和传统报表怎么去重"],
  },
];

const roadmapAnchorIds = new Set([...roadmapCards.map((card) => card.id), "parameter-guide"]);

init();

function init() {
  const hashDoc = decodeURIComponent(location.hash.replace(/^#/, ""));
  state.activeDocId = resolveDocIdFromHash(hashDoc) || docs[0]?.id || null;

  bindEvents();
  renderNav();
  renderActiveDoc();
  scrollToHashAnchor(hashDoc);
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    ensureActiveDocVisible();
    renderNav();
    renderActiveDoc();
  });

  els.content.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-doc-id]");
    if (!link) return;

    const docId = link.dataset.docId;
    if (!docs.some((doc) => doc.id === docId)) return;

    event.preventDefault();
    state.activeDocId = docId;
    history.replaceState(null, "", `#${encodeURIComponent(docId)}`);
    renderNav();
    renderActiveDoc();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    state.query = "";
    renderNav();
    renderActiveDoc();
    els.search.focus();
  });

  els.roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role;
      els.roleButtons.forEach((item) => item.classList.toggle("active", item === button));
      ensureActiveDocVisible();
      renderNav();
      renderActiveDoc();
    });
  });

  els.expandAll.addEventListener("click", () => {
    state.tocCollapsed = !state.tocCollapsed;
    els.tocPanel.classList.toggle("collapsed", state.tocCollapsed);
    els.expandAll.textContent = state.tocCollapsed ? "显示目录" : "收起目录";
  });

  els.copyLink.addEventListener("click", async () => {
    const doc = getActiveDoc();
    if (!doc) return;
    const url = `${location.href.split("#")[0]}#${encodeURIComponent(doc.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      els.copyLink.textContent = "已复制";
      window.setTimeout(() => {
        els.copyLink.textContent = "复制位置";
      }, 1400);
    } catch {
      els.copyLink.textContent = "复制失败";
      window.setTimeout(() => {
        els.copyLink.textContent = "复制位置";
      }, 1400);
    }
  });

  els.aiToggle.addEventListener("click", () => {
    setAiOpen(!state.aiOpen);
  });

  els.aiClose.addEventListener("click", () => {
    setAiOpen(false);
  });

  els.aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await askAi(els.aiInput.value);
  });

  els.aiMessages.addEventListener("click", async (event) => {
    const promptButton = event.target.closest("[data-ai-prompt]");
    if (!promptButton) return;
    await askAi(promptButton.dataset.aiPrompt);
  });

  window.addEventListener("hashchange", () => {
    const hashDoc = decodeURIComponent(location.hash.replace(/^#/, ""));
    const routeDocId = resolveDocIdFromHash(hashDoc);
    if (routeDocId) {
      state.activeDocId = routeDocId;
      renderNav();
      renderActiveDoc();
      scrollToHashAnchor(hashDoc);
    }
  });
}

function renderNav() {
  const filtered = getFilteredDocs();
  els.nav.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有匹配的文档，换个关键词试试。";
    els.nav.append(empty);
    return;
  }

  filtered.forEach((doc, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "doc-button";
    button.classList.toggle("active", doc.id === state.activeDocId);
    if (doc.id === state.activeDocId) {
      button.setAttribute("aria-current", "page");
    }
    button.dataset.docId = doc.id;
    button.innerHTML = `
      <span class="doc-index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      <span class="doc-copy">
        <strong>${escapeHtml(doc.title)}</strong>
        <span>${escapeHtml(doc.summary)}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.activeDocId = doc.id;
      history.replaceState(null, "", `#${encodeURIComponent(doc.id)}`);
      renderNav();
      renderActiveDoc();
      els.content.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    els.nav.append(button);
  });

  scrollActiveNavItemIntoView();
}

function renderActiveDoc() {
  const doc = getActiveDoc();
  if (!doc) {
    els.eyebrow.textContent = "没有匹配结果";
    els.currentTitle.textContent = "未找到内容";
    els.copyLink.disabled = true;
    els.content.innerHTML = `<div class="empty-state">没有匹配的文档，清空搜索或切换岗位筛选。</div>`;
    els.tocList.innerHTML = "";
    return;
  }

  els.copyLink.disabled = false;
  els.currentTitle.textContent = doc.title;
  els.eyebrow.textContent = `${roleLabels[state.role]} · ${doc.title}`;
  els.content.innerHTML = doc.id === "role-roadmaps"
    ? renderRoleRoadmaps(state.query)
    : markdownToHtml(doc.markdown, state.query);
  renderToc();
  updateAiContextHint();
}

function setAiOpen(isOpen) {
  state.aiOpen = isOpen;
  els.aiPanel.hidden = !isOpen;
  els.aiToggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    updateAiContextHint();
    requestAnimationFrame(() => els.aiInput.focus());
  }
}

async function askAi(rawQuestion) {
  const question = rawQuestion.trim();
  if (!question || state.aiBusy) return;

  setAiOpen(true);
  setAiBusy(true);
  els.aiInput.value = "";

  const context = findRelevantChunks(question);
  const activeDoc = getActiveDoc();
  appendAiMessage("user", question);
  const pending = appendAiMessage("assistant", "正在查阅知识库并组织回答...");

  try {
    const response = await fetch(getAiEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        context,
        activeDoc: activeDoc ? { id: activeDoc.id, title: activeDoc.title, summary: activeDoc.summary } : null,
        history: state.aiHistory.slice(-6),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "AI 服务暂时不可用");
    }

    updateAiMessage(pending, data.answer, context);
    rememberAiTurn("user", question);
    rememberAiTurn("assistant", data.answer);
  } catch (error) {
    const fallback = buildLocalFallback(question, context, error.message);
    updateAiMessage(pending, fallback, context);
    rememberAiTurn("user", question);
    rememberAiTurn("assistant", fallback);
  } finally {
    setAiBusy(false);
  }
}

function setAiBusy(isBusy) {
  state.aiBusy = isBusy;
  els.aiSend.disabled = isBusy;
  els.aiInput.disabled = isBusy;
  els.aiSend.textContent = isBusy ? "思考中" : "发送";
}

function appendAiMessage(role, text) {
  const message = document.createElement("article");
  message.className = `ai-message ${role}`;
  message.innerHTML = formatAiAnswer(text);
  els.aiMessages.append(message);
  els.aiMessages.scrollTop = els.aiMessages.scrollHeight;
  return message;
}

function updateAiMessage(message, text, context) {
  const sources = context.length
    ? `<div class="ai-sources"><span>参考</span>${context.slice(0, 3).map((item) => `<button type="button" data-doc-id="${item.docId}">${escapeHtml(item.title)}</button>`).join("")}</div>`
    : "";
  message.innerHTML = `${formatAiAnswer(text)}${sources}`;
  message.querySelectorAll("[data-doc-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const docId = button.dataset.docId;
      if (!docs.some((doc) => doc.id === docId)) return;
      state.activeDocId = docId;
      history.replaceState(null, "", `#${encodeURIComponent(docId)}`);
      renderNav();
      renderActiveDoc();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  els.aiMessages.scrollTop = els.aiMessages.scrollHeight;
}

function rememberAiTurn(role, content) {
  state.aiHistory.push({ role, content });
  state.aiHistory = state.aiHistory.slice(-10);
}

function getAiEndpoint() {
  return location.protocol === "file:" ? "http://localhost:8787/api/ask" : "/api/ask";
}

function updateAiContextHint() {
  const doc = getActiveDoc();
  if (!doc) return;
  els.aiContextHint.textContent = `当前上下文：${doc.title}`;
}

function buildLocalFallback(question, context, errorMessage) {
  const contextLines = context
    .slice(0, 3)
    .map((item) => `- ${item.title}：${item.excerpt.slice(0, 180)}${item.excerpt.length > 180 ? "..." : ""}`)
    .join("\n");

  return [
    `AI 服务还没有连上：${errorMessage}`,
    "",
    "我先从本地知识库帮你定位相关内容：",
    contextLines || "- 没有找到特别匹配的片段，可以换一个更具体的问题。",
    "",
    "要开启深度回答，请在项目根目录设置 OPENAI_API_KEY 后启动本地服务。"
  ].join("\n");
}

function buildKnowledgeChunks(sourceDocs) {
  return sourceDocs.flatMap((doc) => {
    const sections = doc.markdown
      .split(/\n(?=##\s+)/g)
      .map((section) => section.trim())
      .filter(Boolean);

    return sections.map((section, index) => {
      const heading = section.match(/^##\s+(.+)$/m)?.[1]?.trim() || doc.title;
      const text = stripMarkdown(section).replace(/\s+/g, " ").trim();
      return {
        id: `${doc.id}-${index}`,
        docId: doc.id,
        title: heading === doc.title ? doc.title : `${doc.title} · ${heading}`,
        excerpt: text.slice(0, 1200),
        searchText: `${doc.title} ${doc.summary} ${heading} ${text}`.toLowerCase(),
      };
    });
  });
}

function findRelevantChunks(question, limit = 6) {
  const activeDoc = getActiveDoc();
  const tokens = tokenizeQuestion(question);
  const normalizedQuestion = question.toLowerCase();

  return knowledgeChunks
    .map((chunk) => {
      let score = chunk.docId === activeDoc?.id ? 2 : 0;
      if (chunk.searchText.includes(normalizedQuestion)) score += 8;
      tokens.forEach((token) => {
        if (chunk.searchText.includes(token)) score += token.length > 3 ? 3 : 1;
        if (chunk.title.toLowerCase().includes(token)) score += 2;
      });
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ searchText, score, ...chunk }) => chunk);
}

function tokenizeQuestion(question) {
  const normalized = question.toLowerCase();
  const latin = normalized.match(/[a-z0-9_./+-]{2,}/g) || [];
  const chinese = normalized.match(/[\u4e00-\u9fff]{2,}/g) || [];
  return [...new Set([...latin, ...chinese])].slice(0, 24);
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[#>*_|-]+/g, " ");
}

function formatAiAnswer(text) {
  const lines = escapeHtml(text).split(/\r?\n/);
  const html = [];
  let listOpen = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      return;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${formatAiInline(bullet[1])}</li>`);
      return;
    }

    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
    html.push(`<p>${formatAiInline(trimmed)}</p>`);
  });

  if (listOpen) html.push("</ul>");
  return html.join("");
}

function formatAiInline(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderToc() {
  const headingSelector = getActiveDoc()?.id === "role-roadmaps" ? "h2" : "h2, h3";
  const headings = [...els.content.querySelectorAll(headingSelector)].slice(0, 24);
  els.tocList.innerHTML = "";

  if (!headings.length) {
    els.tocList.innerHTML = `<span class="empty-state">当前文档没有二级目录。</span>`;
    return;
  }

  headings.forEach((heading) => {
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${encodeURIComponent(getActiveDoc().id)}`);
    });
    els.tocList.append(link);
  });
}

function ensureActiveDocVisible() {
  const filtered = getFilteredDocs();
  if (!filtered.some((doc) => doc.id === state.activeDocId)) {
    state.activeDocId = filtered[0]?.id || null;
  }
}

function scrollActiveNavItemIntoView() {
  const activeButton = els.nav.querySelector(".doc-button.active");
  if (!activeButton) return;

  const navStyle = window.getComputedStyle(els.nav);
  if (navStyle.overflowX === "visible") return;

  requestAnimationFrame(() => {
    activeButton.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function getFilteredDocs() {
  return docs.filter((doc) => {
    const roleMatch = state.role === "all" || doc.roles.includes(state.role);
    const queryMatch = !state.query || doc.searchText.includes(state.query);
    return roleMatch && queryMatch;
  });
}

function getActiveDoc() {
  const filtered = getFilteredDocs();
  return filtered.find((doc) => doc.id === state.activeDocId) || filtered[0] || null;
}

function resolveDocIdFromHash(hash) {
  if (docs.some((doc) => doc.id === hash)) return hash;
  if (roadmapAnchorIds.has(hash)) return "role-roadmaps";
  return null;
}

function scrollToHashAnchor(hash) {
  if (!roadmapAnchorIds.has(hash)) return;
  requestAnimationFrame(() => {
    document.getElementById(hash)?.scrollIntoView({ block: "start" });
  });
}

function markdownToHtml(markdown, query) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let listType = null;
  let table = [];
  let inCode = false;
  let codeLang = "";
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${formatInline(paragraph.join(" "), query)}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  const flushTable = () => {
    if (!table.length) return;
    html.push(renderTable(table, query));
    table = [];
  };

  lines.forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLang = "";
        codeLines = [];
      } else {
        flushParagraph();
        flushList();
        flushTable();
        inCode = true;
        codeLang = line.replace(/^```/, "").trim();
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    if (line.includes("|") && /^\s*\|?[^|]+\|/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      return;
    }

    flushTable();

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text);
      html.push(`<h${level} id="${id}">${formatInline(text, query)}</h${level}>`);
      return;
    }

    const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${formatInline(orderedMatch[1], query)}</li>`);
      return;
    }

    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType !== "ul") {
        flushList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${formatInline(unorderedMatch[1], query)}</li>`);
      return;
    }

    paragraph.push(line.trim());
  });

  flushParagraph();
  flushList();
  flushTable();

  return html.join("\n");
}

function renderTable(rows, query) {
  const cleaned = rows
    .map((row) => row.trim())
    .filter((row) => row && !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(row));

  if (!cleaned.length) return "";

  const cells = cleaned.map((row) =>
    row
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );

  const [head, ...body] = cells;
  const headHtml = head.map((cell) => `<th>${formatInline(cell, query)}</th>`).join("");
  const bodyHtml = body
    .map((row) => `<tr>${row.map((cell) => `<td>${formatInline(cell, query)}</td>`).join("")}</tr>`)
    .join("");

  return `<div class="table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function renderRoleRoadmaps(query) {
  const cardLinks = roadmapCards
    .map((card, index) => `
      <a class="map-node ${card.color}" href="#${card.id}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(card.title.replace("路线", ""))}</strong>
      </a>
    `)
    .join("");

  const cards = roadmapCards.map((card) => {
    const docLinks = card.docs
      .map((docId) => {
        const doc = docs.find((item) => item.id === docId);
        if (!doc) return "";
        return `<a href="#${doc.id}" data-doc-id="${doc.id}">${escapeHtml(doc.title)}</a>`;
      })
      .join("");

    const steps = card.steps
      .map((step, index) => `
        <li class="path-step">
          <span class="step-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>${highlightText(escapeHtml(step.name), query)}</strong>
            <p>${highlightText(escapeHtml(step.desc), query)}</p>
            <div class="term-cloud">${step.terms.map((term) => renderTermChip(term, query)).join("")}</div>
          </div>
        </li>
      `)
      .join("");

    const outcomes = card.outcomes
      .map((item) => `<li>${highlightText(escapeHtml(item), query)}</li>`)
      .join("");

    return `
      <section class="roadmap-card ${card.color}" id="${card.id}">
        <header>
          <span class="role-kicker">学习路线</span>
          <h2 id="${card.id}-heading">${highlightText(escapeHtml(card.title), query)}</h2>
          <p>${highlightText(escapeHtml(card.goal), query)}</p>
        </header>
        <ol class="path-steps">${steps}</ol>
        <div class="roadmap-footer">
          <div>
            <h3>完成后应该能回答</h3>
            <ul class="answer-list">${outcomes}</ul>
          </div>
          <div>
            <h3>直接打开相关模块</h3>
            <div class="module-links">${docLinks}</div>
          </div>
        </div>
      </section>
    `;
  }).join("");

  return `
    <div class="roadmap-page">
      <section class="roadmap-hero">
        <span class="role-kicker">Learning map</span>
        <h1>按岗位学习路线</h1>
        <p>把“每个团队要学什么”拆成可以扫读的路线卡：先知道目标，再按节点学习，最后用问题检查自己是否真正理解。</p>
        <div class="role-map" aria-label="岗位学习地图">
          <div class="map-core">
            <strong>AppsFlyer 核心能力</strong>
            <span>归因 · 链接 · 事件 · 报表 · 增长</span>
          </div>
          <div class="map-nodes">${cardLinks}</div>
        </div>
      </section>
      <section class="parameter-guide">
        <h2 id="parameter-guide">截图里那些参数是什么意思</h2>
        <p>它们是增长链接里的归因参数，不是报错。网页现在会把常见参数显示成解释型标签。</p>
        <div class="term-cloud">
          ${["pid", "c", "af_adset", "af_ad", "is_retargeting=true", "deep_link_value"].map((term) => renderTermChip(term, query)).join("")}
        </div>
      </section>
      <div class="roadmap-grid">${cards}</div>
      <p class="source-note">来源：AppsFlyer Developer Hub、OneLink、SKAN、ROI360、Data Locker、Partner Integrations、Protect360、Audiences、Incrementality 文档。完整链接见 <a href="#sources" data-doc-id="sources">官方来源索引</a>。</p>
    </div>
  `;
}

function formatInline(text, query) {
  let result = escapeHtml(text);

  result = result.replace(/`([^`]+)`/g, (_match, code) => renderInlineCode(code));
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\[([^\]]+)\]\((#[^)]+)\)/g, (_match, label, href) => {
    const docId = href.slice(1);
    const isKnownDoc = docs.some((doc) => doc.id === docId);
    if (!isKnownDoc) {
      return `<a href="${href}">${label}</a>`;
    }
    return `<a href="${href}" data-doc-id="${docId}">${label}</a>`;
  });
  result = result.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');

  if (query) {
    result = highlightHtmlText(result, query);
  }

  return result;
}

function renderInlineCode(code) {
  if (inlineTermNotes[code]) {
    return renderTermChip(code);
  }

  return `<code>${escapeHtml(code)}</code>`;
}

function renderTermChip(term, query) {
  const note = inlineTermNotes[term];
  if (!note) {
    return `
      <span class="term-chip compact">
        <span>${highlightText(escapeHtml(term), query)}</span>
      </span>
    `;
  }

  return `
    <span class="term-chip" title="${escapeHtml(note)}">
      <span>${highlightText(escapeHtml(term), query)}</span>
      <small>${escapeHtml(note)}</small>
    </span>
  `;
}

function highlightText(text, query) {
  if (!query) return text;
  const safeQuery = escapeRegExp(escapeHtml(query));
  return text.replace(new RegExp(`(${safeQuery})`, "gi"), '<mark class="highlight">$1</mark>');
}

function highlightHtmlText(html, query) {
  if (!query) return html;
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith("<") ? part : highlightText(part, query)))
    .join("");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `section-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
