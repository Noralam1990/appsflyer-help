# SKAN 与 iOS 隐私专项笔记

## 1. 新手先抓住一句话

iOS 14.5+ 以后，传统基于 IDFA 的用户级归因受 ATT 限制。SKAN 是 Apple 提供的聚合归因框架，AppsFlyer 负责接收、解码、展示、建模、去重和对接，但 SKAN 的 postback、隐私阈值、窗口机制由 Apple 生态决定。

## 2. ATT、IDFA、AAP、SKAN 的关系

| 概念 | 控制什么 | 对 AppsFlyer 的影响 |
|---|---|---|
| ATT | 用户是否允许跨 app/网站 tracking | 未授权时 IDFA 不可用，user-level attribution 受限 |
| IDFA | iOS 广告标识符 | 双方授权时可用于确定性匹配和 SRN postback |
| AAP | AppsFlyer Aggregated Advanced Privacy | 限制 user-level attribution data 可见性和对 partner 的共享 |
| SKAN | Apple 聚合归因 | 不依赖用户级 ID，数据延迟、聚合、受隐私阈值影响 |
| SSOT | AppsFlyer 的 Single Source of Truth | 将 ID matching、SKAN、ASA 等多来源 iOS 归因去重整合 |

## 3. SKAN 4 的三个窗口

AppsFlyer SKAN Conversion Studio 文档和 Apple Developer 文档都确认，SKAN 4 支持多个 postback / measurement windows。AppsFlyer 文档中 SKAN 4 的三个非重叠测量窗口为：

| Window | 时间 | 典型用途 |
|---|---|---|
| Window 1 | 第 1-2 天 | 首次打开、注册、教程完成、早期购买、早期收入 |
| Window 2 | 第 3-7 天 | 次日后留存、二次行为、试用进展、早期付费质量 |
| Window 3 | 第 8-35 天 | 中期留存、订阅、付费成熟度、长期质量信号 |

注意：

- Window 2 只测第 3-7 天，不是第 0-7 天累计。
- Window 3 只测第 8-35 天，不是第 0-35 天累计。
- 用户行为发生在窗口结束后，会被该窗口忽略。

## 4. Conversion Value 设计

CV 的本质是把有限信息编码成可汇总的质量信号。你不是“想测什么就都测”，而是在有限容量里做取舍。

常见策略：

- Revenue：收入范围。
- Conversion：某关键事件是否发生。
- Engagement：某事件发生次数。
- Funnel：用户完成到漏斗哪一步。
- Priority：在多个信号中让更重要的信号优先。
- SSOT：为去重占用一部分 CV 空间。

SKAN 4 设计建议：

1. Window 1 放最强早期质量信号，比如注册、购买、订阅开始、关键教程完成。
2. Window 2 放留存或二次质量，比如 D3-D7 的激活、复购、付费进展。
3. Window 3 放更长期但低粒度的价值信号。
4. 不要把所有事件都塞进去。低频事件会被隐私阈值和样本量影响。
5. 高价值事件和高覆盖事件要平衡。只选超低频付费事件，可能导致大量 null/low 信息。

## 5. Fine CV、Coarse CV、Null CV

| 类型 | 含义 | 怎么处理 |
|---|---|---|
| Fine CV | 0-63 的精细值 | 适合 Window 1 的核心优化 |
| Coarse CV | low / medium / high | 适合低数据量或后续窗口的粗粒度质量 |
| Null CV | 没有 conversion value | 先排查 SKAN 开关、SDK、partner、postback copy、隐私阈值、样本量 |

SKAN 4 中，Apple 的 crowd anonymity 会影响 postback 可包含多少细节。数据量不足时，你可能只能拿到 coarse 值，甚至拿不到 CV。

## 6. Conversion Studio 操作检查

上线前检查：

- App 使用支持 SKAN 的 AppsFlyer SDK 版本；具体版本以最新 SDK release notes 为准。
- AppsFlyer 中 SKAN measurement 已开启。
- Conversion Studio 选择 SKAN 4 或当前业务需要的 mode。
- Window 1/2/3 的信号设计经过 UA、产品、数据、开发共同确认。
- 如果使用 S2S 事件，确认该 mode 支持，并且事件能被 AppsFlyer 收到。
- Partner event postback mapping 包含 SKAN 配置里使用的事件。
- 需要 SSOT 时，在 Conversion Studio 中启用并理解它会占用 CV 容量。
- iOS 15+ postback copy 如需直接发送给 AppsFlyer，按官方文档配置。

上线后检查：

- SKAN dashboard 是否有 postback 数据。
- Null CV 比例是否异常。
- SKAN 数据延迟是否符合预期。
- partner 侧 campaign ID / source identifier 是否有足够粒度。
- SKAN 和 traditional dashboard 是否通过 SSOT 做去重解读。

## 7. SSOT 怎么理解

iOS 里可能同时出现：

- ID matching 归因。
- SKAN 归因。
- Apple Search Ads。
- IDFV / AAP / probabilistic 等其他方法。

如果不去重，同一个安装可能在不同来源中重复出现。SSOT 的目标是把这些归因方法合并成更统一的 iOS campaign performance 视角。

注意：

- SSOT 不是让 SKAN 变成用户级数据。
- SSOT 需要理解不同数据源的延迟和限制。
- Data Locker 有 SSOT report，可给 BI 做更严肃的统一分析。

## 8. iOS 隐私避坑

- 不要把 SKAN 当作实时优化数据源。postback 有延迟。
- 不要把 null CV 直接等同于“用户没价值”。它可能是隐私阈值或配置问题。
- 不要在 ATT 未授权时期待完整 IDFA 归因和 SRN user-level postbacks。
- 不要随便关闭 AAP 或 partner-level Advanced Privacy，涉及数据共享和合规。
- 不要只配置 Conversion Studio，忘记 partner in-app event postback mapping。
- 不要让 event taxonomy 和 SKAN schema 脱节。
- 不要直接复制旧 SKAN 3 的 24 小时思路到 SKAN 4。三个窗口是非重叠的。
- 不要忽略 Apple 官方 SKAN 定义；AppsFlyer 是执行和呈现层，底层约束来自 Apple。

## 9. 最小协作清单

UA 需要给出：

- 优化目标：install、registration、purchase、subscription、ROAS。
- 主要渠道和 campaign 粒度要求。
- 是否要 SSOT。
- 是否要给 partner 回传 SKAN events。

产品/数据需要给出：

- 早期质量事件和业务漏斗。
- 各事件覆盖率和触发时间分布。
- 收入、订阅、退款、广告收入口径。

开发需要确认：

- SDK 版本和初始化。
- 事件和参数上报。
- ATT 提示和隐私方法。
- S2S 事件是否带必要 ID。
- postback copy / associated domains / Universal Links 等 iOS 配置。

来源：AppsFlyer SKAN Conversion Studio、SKAN solution guide、SKAN dashboard、SSOT guide、AAP framework、privacy-preserving SDK methods、Apple Developer SKAdNetwork 文档。完整链接见 [官方来源索引](#sources)。
