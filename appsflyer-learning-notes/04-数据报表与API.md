# 数据、报表、API 与 BI 速查

## 1. LTV 和 Activity 是第一道分水岭

| 口径 | 以什么时间为准 | 用来回答 |
|---|---|---|
| LTV | 用户安装/归因的时间 | 这批用户后来贡献了多少价值 |
| Activity | 行为实际发生的时间 | 今天/这段时间 app 里发生了什么 |

例子：

- 用户 4 月 1 日安装，4 月 10 日购买。
- Overview / Events / Cohort 的 LTV 视角通常会把这笔价值归到 4 月 1 日那批用户。
- Activity 视角会把购买计入 4 月 10 日。

## 2. 常用 dashboard 选择

| Dashboard | 视角 | 适合谁 |
|---|---|---|
| Overview | UA/retargeting LTV | 增长负责人 |
| Activity | 活动日行为 | 产品、运营、数据 |
| Events | UA LTV events | 增长、数据 |
| Cohort & Retention | 生命周期表现 | 数据、增长、产品 |
| SKAN | iOS SKAN postback | iOS UA、数据 |
| Protect360 | fraud | UA、渠道管理 |
| My Dashboards | 自定义多指标分析 | 数据、管理层 |

## 3. Raw data 什么时候用

用 raw data 的典型场景：

- 和后端订单、注册、订阅对账。
- 和渠道回传/postback 对账。
- 排查某个 campaign / user / event 为什么没有出现。
- 建 BI 数仓。
- 做 user journey 分析。
- 做 Protect360 fraud reconciliation。
- 把 AppsFlyer ID、CUID、campaign、event 参数 join 到内部数据。

注意：

- Raw data 受订阅、权限、隐私、保留期、partner 限制影响。
- 有些 SRN 点击/曝光不会出现在 raw data。
- AAP 开启后，部分 user-level 字段会受限。
- 用户级数据保留和访问窗口需要按最新官方文档确认。

## 4. Export、Pull API、Push API、Data Locker 怎么选

| 工具 | 模式 | 适合场景 | 注意 |
|---|---|---|---|
| Export page | 人工下载 | 临时分析、一次性对账 | 不适合稳定管道 |
| Pull API aggregate | 主动拉聚合 CSV | 自动日报、聚合指标 | 注意行数、timezone、currency |
| Pull API raw data | 主动拉 raw data | 补数、定时明细报表 | 大数据量要切时间窗口 |
| Push API | AppsFlyer 推送事件到 endpoint | 近实时流式处理 | 字段选择要定期复查 |
| Data Locker | 文件送云存储/数仓 | BI 主通道、大规模数据 | 需要订阅和云端配置 |

## 5. Data Locker 设计建议

建议数据团队按以下方式建模：

- `raw_installs`
- `raw_in_app_events`
- `raw_sessions`
- `raw_uninstalls`
- `ad_revenue`
- `cost_etl`
- `protect360_blocked`
- `protect360_post_attribution`
- `skan_postbacks`
- `ssot`
- `web_end_user_events`
- `web_conversions`
- `cross_platform_events`

字段治理：

- 使用 campaign ID、adset ID、ad ID 优先于 name 做稳定 join。
- 保留原始 timezone 和标准化 timezone。
- 保留原始 currency 和标准化 currency。
- 事件参数拆成宽表前，先保存原始 event value。
- 对 PII、IDFA、GAID、CUID 的访问做权限分层。

## 6. API 常见坑

- Pull API 返回最大行数时，不能假设数据完整；需要拆分时间窗口。
- 不传 timezone 可能默认 UTC，和 dashboard 的 app timezone 对不上。
- 不传 currency 或使用默认 USD，可能和 app-specific currency 对不上。
- Campaign name 可能变更，ID 更可靠。
- Push API 的 “ALL FIELDS” 行为有过更新：新字段不一定自动包含，需要定期复查字段选择。
- Data Locker availability window 有限制，错过窗口要看是否有补数方案。
- Raw data 的 user-level retention 不等于你能无限查历史明细。

## 7. BI 对账检查表

每次发现差异，按这个顺序问：

1. 这是 AppsFlyer、渠道、商店、后端、SKAN 还是 BI 口径？
2. 时间字段用的是 install time、event time、attributed touch time、postback arrival date 还是 processing date？
3. timezone 是否一致？
4. currency 是否一致？
5. LTV 和 Activity 是否混用了？
6. Retargeting 和 UA 是否重复算了？
7. `is_primary_attribution` 是否处理正确？
8. Organic 是否包含在分析范围内？
9. SRN 是否有 user-level 或 click/impression 限制？
10. AAP / ATT / privacy restrictions 是否导致字段为空？
11. Fraud blocked/post-attribution fraud 是否从普通报表中排除或另行调整？
12. 数据是否已经完成延迟更新？

来源：Overview、Activity、Events、Cohort、Raw data reporting overview、Data Locker、Pull API、Push API、User-level data retention、SSOT Data Locker、Web Attribution Data Locker。完整链接见 [官方来源索引](#sources)。
