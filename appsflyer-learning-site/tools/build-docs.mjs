import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const siteToolsDir = dirname(fileURLToPath(import.meta.url));
const root = join(siteToolsDir, "..", "..");
const notesDir = join(root, "appsflyer-learning-notes");
const outFile = join(root, "appsflyer-learning-site", "docs-data.js");

const meta = [
  {
    file: "00-总览与使用方式.md",
    id: "overview",
    title: "总览与使用方式",
    summary: "知识分类地图、最短学习路径、可信度说明",
    roles: ["newbie", "ua", "product", "data", "dev", "skan"],
  },
  {
    file: "01-术语速查.md",
    id: "glossary",
    title: "术语速查",
    summary: "归因、链接、SKAN、报表、收入、反作弊术语",
    roles: ["newbie", "ua", "product", "data", "dev", "skan"],
  },
  {
    file: "02-核心知识笔记.md",
    id: "core-notes",
    title: "核心知识笔记",
    summary: "归因、OneLink、SDK、报表、ROI、渠道和人群",
    roles: ["newbie", "ua", "product", "data", "dev"],
  },
  {
    file: "03-SKAN与iOS隐私.md",
    id: "skan-ios-privacy",
    title: "SKAN 与 iOS 隐私",
    summary: "ATT、IDFA、AAP、SKAN 4、CV、SSOT 和配置检查",
    roles: ["ua", "data", "dev", "skan"],
  },
  {
    file: "04-数据报表与API.md",
    id: "data-reporting-api",
    title: "数据报表与 API",
    summary: "LTV、Activity、Raw Data、Data Locker、Pull/Push API",
    roles: ["ua", "product", "data", "dev"],
  },
  {
    file: "05-岗位学习路线.md",
    id: "role-roadmaps",
    title: "岗位学习路线",
    summary: "新手、增长、产品、数据、开发、iOS/SKAN 路线",
    roles: ["newbie", "ua", "product", "data", "dev", "skan"],
  },
  {
    file: "06-避坑清单.md",
    id: "pitfalls",
    title: "避坑清单",
    summary: "归因、链接、SDK、SKAN、渠道、ROI、BI、反作弊风险",
    roles: ["newbie", "ua", "product", "data", "dev", "skan"],
  },
  {
    file: "99-官方来源索引.md",
    id: "sources",
    title: "官方来源索引",
    summary: "官方链接、核查日期、页面更新时间和采用依据",
    roles: ["newbie", "ua", "product", "data", "dev", "skan"],
  },
];

const docs = await Promise.all(
  meta.map(async (item) => {
    const markdown = await readFile(join(notesDir, item.file), "utf8");
    const { file, ...publicItem } = item;
    return {
      ...publicItem,
      markdown,
    };
  })
);

await writeFile(
  outFile,
  `window.APPSFLYER_DOCS = ${JSON.stringify(docs, null, 2)};\n`,
  "utf8"
);

console.log(`Generated ${outFile}`);
