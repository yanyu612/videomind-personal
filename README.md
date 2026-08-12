<div align="center">

# 🧵 ReelLoom

### 让你的收藏夹学会思考

**Local-first · Turn Video Favorites into a Living Knowledge Base**

[English](#english) | [中文](#中文)

> **项目来源与维护说明**：ReelLoom 基于 MIT 许可的
> [HU1234top/videomind](https://github.com/HU1234top/videomind) 发展而来，
> 现由本仓库独立维护，重点投入可恢复的抖音→Obsidian 工作流、分层分类、
> 本地知识输出与恢复工具。完整说明见 [NOTICE.md](NOTICE.md)。

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue.svg)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/playwright-core-orange.svg)](https://playwright.dev)

</div>

---

<!-- AEO / SEO meta (for AI crawlers like ChatGPT, Perplexity, Gemini) -->
<!-- Keywords: video to knowledge base, douyin scraper, bilibili analyzer, doubao ai, kimi ai, gemini, claude, agent, playwright, zero api cost, free ai, knowledge graph -->

<a id="中文"></a>

## 🚀 3 句话电梯演讲

1. **做什么**：把抖音/B站收藏夹里的教程视频，自动转成**可检索、可链接、可复用的知识库**
2. **怎么做到**：本地 Agent 用 Playwright 协调你已授权的浏览器会话，把页面信息交给可用 Analyzer，再输出本地 Markdown / Obsidian 知识
3. **为什么**：传统方案往往需要保存视频、调用付费 API 或使用本地 GPU；ReelLoom 优先复用用户已有的浏览器会话与网页端额度，在一次 76 个视频的实测中没有产生 API 费用

## 🎯 一句话定位

把抖音/B站收藏条目通过本地 Agent 与用户有权使用的 Analyzer 整理成可检索、可关联、可复用的 Markdown / Obsidian 知识；第三方服务的价格、额度与权限以其当前规则为准。

## 🤔 为什么做这个项目

你的收藏夹在吃灰吗？

- 抖音/B站收藏了几百个教程视频，但从来没系统看过
- 想学 AI / 编程 / 设计，收藏了一大堆，不知道从哪开始
- 视频太多，逐个看要花几十个小时

## 🚫 何时不用 ReelLoom

- 你只有 5-10 个视频 —— 手动看更快
- 你需要**实时**视频理解 —— ReelLoom 是批量处理
- 你需要**逐字稿**（word-by-word 转录）—— ReelLoom 用 Web AI 理解，**不保证字字对应**
- 你无法在本地跑浏览器 —— Playwright + CDP :9222 是硬性要求

## 🆚 传统方案的痛点

| 步骤 | 痛点 |
|------|------|
| 下载视频 | 抖音有**防下载保护**，大量视频无法直接保存到本地 |
| 转录音频 | Whisper 本地转录需 GPU 算力；云端 API 按时长收费 |
| 分析内容 | 云端与网页端模型的定价、额度和限制会变化 |
| 整理入库 | 人工手动分类、写摘要，效率极低 |

**ReelLoom 的方案：不保存原视频，优先使用用户已有的网页端 AI 权限完成分析，并把结果留在本地。**

核心思路：用户在浏览器中登录目标平台后，由本地 Agent 辅助完成采集、分析和结构化整理。网页服务的可用额度、频率限制和使用条款由各服务商决定，ReelLoom 不承诺无限额度。

## 🏆 已验证成果

> 这些数据来自一次真实的端到端跑通（2026-06，76 个抖音「skills」收藏条目；处理记录包含重试）。

| 指标 | 数值 | 备注 |
|------|------|------|
| 抖音「skills」收藏夹抓取 | **76 个视频** | 实测通过 |
| 豆包 AI 分析 | **76 个收藏条目形成可用输出** | 处理记录包含深度结果、增强基础结果及重试；不把重试条数当作成功率 |
| 评论数据提取 | 71 条 | 由豆包分析阶段附带产出 |
| AI 技术方向自动筛选 | 68 个 | 关键词过滤（详见 `knowledge-builder.mjs`） |
| 自动 8 类分类 | ✅ | 关键词匹配 + 防漏兜底（每个视频必落入分类） |
| 本地 Markdown 输出 | ✅ | YAML frontmatter + Obsidian wikilinks |
| 多模态视频理解 | ✅ | 豆包/Kimi 读视频画面；B 站自动取 CC 字幕喂给 AI |
| **本次 API 成本** | **$0** | 只描述该次实测，不承诺第三方服务长期免费 |

不登录任何平台也可以先查看一份[脱敏示例知识卡](examples/sample-knowledge-card.md)，了解 ReelLoom 的本地输出结构。

## 🏗️ 核心架构

```
Local Agent (编排调度)
    │
    ▼
Collector: 抖音/B站 Adapter（YouTube 仍在规划）
    │  ┌─ 防下载保护？直接在浏览器里看，不用下载
    │  ├─ 标签/话题系统？自动提取 #AI #编程 等标签
    │  ├─ 评论/弹幕？抓取前 N 条作为分析素材
    │  └─ 封面/关键帧？截图辅助 AI 视觉理解
    ▼
决策: 任务复杂度?
   │              │
串行模式          并行模式
(主力+Fallback)   (多模型共识仲裁)
   │              │
    └────────────┘
         │
         ▼
Analyzer: 豆包/Kimi/Gemini/Claude Web-SubAgent
         │  ┌─ 使用用户可用的网页端额度与配额
         │  ├─ 多模态理解：看封面+读评论+分析转写
         │  └─ 10维度技能聚焦分析框架
         ▼
Builder: 去重/标签(8类)/技能点/知识图谱
         │
         ▼
Sink: Obsidian/Markdown（其他 Sink 以 STATUS 为准）
```

## 💡 成本与依赖模型

ReelLoom 本身开源免费，但运行成本取决于用户选择的浏览器服务、账号额度或本地模型。
仓库记录的一次 76 条收藏实测没有产生 API 费用，这不是对第三方服务价格的长期承诺。

1. **不保存原视频** — ReelLoom 在用户已登录的浏览器会话中处理页面信息，减少本地媒体存储与转码需求。
2. **复用你已登录的浏览器** — Chrome CDP :9222 连接真实浏览器，跳过登录和 Cookie 管理。
3. **利用用户已有的网页端权限** — 是否免费、可用多少以及能否自动化，取决于对应服务当时的条款和配额。
4. **本地 Agent 负责调度与落库** — 规划任务、组装 prompt、合并结果，并把知识文件保存在本地。

> 借鉴了 [AgentChat](https://github.com/) 的 Web-SubAgent 思想，但垂直聚焦于「视频 → 知识库」场景。

## 📖 三个真实使用场景

**场景 1：知识工作者的「第二大脑」**

> 你抖音收藏了 200 个 AI/编程/设计教程视频，但从来没系统看过。想学"Agent 架构"时不知道从哪开始。
>
> → ReelLoom 跑一遍：76 个视频变成 76 个**结构化技能卡片**，自动分到 8 个类别，可按关键词回到相关条目继续学习。

**场景 2：自媒体的「选题灵感库」**

> 你想做 AI 教程视频，需要看同类博主最近在讲什么。手动翻 100 个视频太慢。
>
> → ReelLoom 整理页面可见的标题、标签和允许处理的评论数据，形成可检索的主题线索。

**场景 3：研究者的「文献综述替代」**

> 你研究 AI Agent 趋势，需要整理 B 站等视频来源中的观点。
>
> → ReelLoom 可用双 Analyzer 做**字段级仲裁**，保留 confidence 与 conflicts，方便人工复核分歧。

## 🤔 ReelLoom 的边界与差异

- 输出保存在本地 Markdown / Obsidian，而不是只留在在线聊天里。
- 把视频当作可学习的技能单元，输出结构化字段，不只生成一段摘要。
- 支持断点续跑、分层分类、失败恢复和 Analyzer 仲裁。
- 当前重点是抖音→Obsidian；其他平台能力以 [STATUS](docs/STATUS.md) 为准，不把规划写成已完成。

## ❓ FAQ（AI 搜索常抓）

### ReelLoom 一定免费吗？
ReelLoom 本身开源免费。一次 76 条收藏的实测没有产生 API 费用，但网页服务的免费额度、账号要求和自动化政策会变化，项目不承诺第三方服务永久免费。

### 会违反抖音/B站 ToS 吗？
**仅用于个人学习研究**，遵守各平台 ToS：
- 不存储原视频文件（只存链接和结构化摘要）
- 建议每个视频间隔 5-10 秒
- 遇到验证码时停止自动化，人工处理

详见 [`⚠️ 负责使用`](#-负责使用) 章节。

### 需要 GPU 吗？
默认流程不需要 GPU。本地 Agent 负责调度与整理，分析能力来自用户选择且有权使用的网页服务；若改用本地转录或视觉模型，则硬件需求会变化。

### 抓 100 个视频要多久？
实测 76 视频约 40 分钟（含 AI 分析时间）。如果 AI 分析是瓶颈，可调 `--analyze-mode parallel` 用多 AI 并行，**通常快 2-3 倍**。

### 跟别的 AI 总结工具有什么区别？
**核心差异**：ReelLoom 把每个视频当作**一个可学习的技能单元**，输出 10 维度结构化（技能名称/等级/前置知识/学习路径等），而不是简单摘要。这套框架专为“收藏夹 = 技能库”场景设计。

### 我只会用 Chrome，不会用命令行怎么办？
ReelLoom 是 CLI 工具，需要 `node src/cli.mjs` 启动。门槛是 Node.js 基础 + 会看终端输出。**目前没有 GUI**。

### 可以商用吗？
**MIT License**，可商用。但你**要为内容合规负责**（见 ToS 章节）。

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- Chrome / Edge 浏览器（已登录目标平台）
- 已登录豆包/Kimi 等网页 AI 账号

### 安装

```bash
git clone https://github.com/yanyu612/reelloom.git
cd reelloom
npm install
```

### 启动 Chrome（开启远程调试）

```bash
# Windows
chrome.exe --remote-debugging-port=9222

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### 运行

```bash
# 1. 采集抖音收藏夹（直接在浏览器里操作，无需下载视频）
node src/cli.mjs collect --platform douyin --collection skills

# 2. 用豆包分析所有视频（串行模式）
node src/cli.mjs analyze --analyzer doubao

# 3. 构建知识库
node src/cli.mjs build

# 4. 输出为 Markdown
node src/cli.mjs sync --sink markdown
```

## ⚙️ 配置（zod 校验 + .env 覆盖）

所有命令参数在启动时由 [`zod`](https://github.com/colinhacks/zod) schema 校验，错误立刻打印带字段路径的提示并退出（exit code 2）：

```bash
# 错误示例
$ node src/cli.mjs analyze --mode banana --analyzer gpt4
[ConfigError] Invalid configuration for command "analyze"

Configuration problems:
  - analyzer: Invalid option: expected one of "doubao"|"kimi"|"gemini"|"claude"
  - mode: Invalid option: expected one of "sequential"|"parallel"

Tip: check CLI args, env vars, or .env file. Run with --help to see defaults.
```

**优先级**：CLI args > 环境变量 > `.env` 文件 > defaults。

**用 `.env` 覆盖**（项目根新建 `.env`，参考 [`.env.example`](.env.example)）：

```bash
# .env
COLLECT_PLATFORM=bilibili
ANALYZE_MODE=parallel
ANALYZE_NO_CHECKPOINT=true
LOG_LEVEL=info
LOG_FILE=./videomind.log
```

支持的 env 变量按命令前缀分组（`COLLECT_*` / `ANALYZE_*` / `BUILD_*` / `SYNC_*`），未加前缀的全局变量（`LOG_LEVEL` / `LOG_FILE`）被 logger 消费。详见 [`src/core/config.mjs`](src/core/config.mjs)。

## 🪵 可观测性（结构化日志）

所有运行日志通过 [`pino`](https://github.com/pinojs/pino) 输出为 JSON，每行带 `requestId` / `stage` / `component` 字段，便于按批次关联：

```bash
# 默认：JSON 到 stdout
node src/cli.mjs analyze

# 输出到文件 + 调级别
LOG_LEVEL=debug LOG_FILE=./videomind.log node src/cli.mjs analyze

# 测试/CI 静音
LOG_LEVEL=silent node src/cli.mjs analyze
```

日志行示例：

```json
{"level":"info","time":"2026-07-10T03:32:22.944Z","name":"videomind","requestId":"210361d9-...","component":"analyzer","platform":"doubao","stage":"analyze","msg":"analyzed","url":"https://...","title":"Claude Code..."}
```

按 `requestId` 过滤可重建单个 analyze 批次的完整轨迹。详细字段约定见 [`src/core/logger.mjs`](src/core/logger.mjs)。

## 📊 技能聚焦分析框架（10维度）

每个视频经过深度分析后输出 **10 个技能学习维度**，专为「收藏夹 = 技能库」场景设计：

| # | 维度 | 说明 | 示例 |
|---|------|------|------|
| 1 | **技能名称** | 视频教的具体是什么技能 | "Claude 学习加速法" / "Firecrawl 免 API 爬取" |
| 2 | **技能等级** | 入门/中级/高级/专家 | 入门 → 专家 5 级 |
| 3 | **核心要点** | 3-5 个必须记住的关键点 | "6 步学习闭环"、"二八法则锁定核心" |
| 4 | **实操步骤** | 可直接照做的步骤清单 | Step 1: 拆分技能等级 → Step 2: ... |
| 5 | **工具/资源** | 视频提到的具体工具/网站 | AgentChat / Firecrawl / Claude |
| 6 | **避坑指南** | 作者提醒的常见错误 | "不要把 Claude 当搜索引擎"、"低价 API 缺多模态" |
| 7 | **适用场景** | 什么情况下用这个技能 | AI 自动化编程 / 网页数据采集 |
| 8 | **前置知识** | 学这个需要先掌握什么 | 基础 Python / 了解 Agent 架构 |
| 9 | **学习路径** | 跟哪些视频组合学习效果最好 | "先看 #3 Agent 入门 → 再看 #7 实操" |
| 10 | **关键词标签** | 自动生成的分类标签 | `#AI-Agent` `#爬虫` `#开源工具` |

> 💡 和通用「摘要+标签」不同，这个框架把每个视频当作**一个可学习的技能单元**来拆解，输出的是「我能学什么 → 怎么学 → 需要什么基础 → 跟什么搭配」的完整技能地图。

## 🎯 抖音收藏夹的特殊能力

抖音是 ReelLoom 第一个验证的平台，因为它有几个独特挑战和优势：

### 无需保存原视频
ReelLoom 面向个人知识整理场景，在用户已登录的浏览器会话中读取页面可见信息并完成分析编排，不把原视频文件纳入知识库。

### 标签/话题系统
抖音视频自带 `#AI` `#编程` `#开源工具` 等话题标签，ReelLoom 使用页面可见标签作为初始分类依据，结合分析结果进行二次归类。

### 评论数据采集
在用户有权处理且页面允许访问时，ReelLoom 可把部分页面可见评论作为分析辅助素材；默认限速并在出现验证码时停止。

### 语音转文字
豆包等网页 AI 可以直接理解视频中的语音内容，无需本地 Whisper 转录。

## 🔌 支持矩阵

> **状态图例**：
> - ✅ **Verified** — 实测通过，有数据支撑
> - 🟡 **Partial** — 部分功能能用，但有限制
> - 📋 **Planned** — 写在 roadmap 里，**代码还没写**
> - 🔮 **Future** — 远期想法，连设计都没定

### ✅ 现在能跑（实测）

| 模块 | 平台/工具 | 验证场景 |
|------|----------|----------|
| Collector | 🇨🇳 抖音 + 🎬 B 站 | 抖音收藏夹批量抓取（76 视频实测）；B 站 CC 字幕自动摄入 |
| Analyzer | 🧠 双 AI 路由 + 共识仲裁 | 豆包 + Kimi 真实实现；AnalyzerRouter 提供 sequential + consensus 双模式（consensus 字段级投票，置信度 + 冲突明细） |
| Builder | KnowledgeBuilder | 8 类自动分类（防漏兜底）+ Levenshtein 去重（阈值 0.6） |
| Sink | Markdown / Obsidian | Markdown 含 frontmatter + wikilinks；Obsidian 含 Vault 结构；外部同步实验不算核心开源能力 |
| Checkpoint | SQLite | 断点续传：跑 76 视频中途崩了下次自动从断点继续（Phase A Task 1） |
| 自适应限流 | Token Bucket + 5xx/CAPTCHA 退避 | 实测能稳定跑 1000+ 视频不触发风控（Phase A Task 5） |
| 结构化日志 | pino + requestId | 每条记录可按 batch / videoId / analyzer 追溯（Phase A Task 3） |

### 🟡 渐进交付中（已在路上，扩展期陆续上线）

| 模块 | 进度 |
|------|------|
| Collector 评论抓取 | 已用，分析阶段再补一次保证覆盖 |
| Obsidian Dataview 查询 | 生成 Dataview 友好的 frontmatter |
| 并行模式 + 共识仲裁 | AnalyzerRouter.routeConsensus 同跑多 AI，字段级投票合并，标 confidence + conflicts（Round 18 L1） |

### 🔮 下一阶段重点（**Phase B 推进**）

| 模块 | 备注 |
|------|------|
| 🇨🇳 B 站 Collector 增强 | 弹幕/分P/UP主信息处理 |
| 🌍 YouTube Collector | CC 字幕 + Chapters + 长视频分段 |
| Gemini / Claude Analyzer | 路由已搭好，配置增强中（沿用 BaseAnalyzer 框架） |
| 并行共识 + 字段置信度 | 基于现有多 AI 路由的仲裁层 |
| 知识图谱 / Web UI | Phase C |

### 🔮 远期想法

| 方向 | 描述 |
|------|------|
| 🇨🇳 小红书 | 图文笔记适配 |
| 插件市场 | 第三方 Adapter/Analyzer/Sink |
| 云端部署（可选） | 自托管服务 |

> 详见 [ROADMAP.md](ROADMAP.md) 看完整规划，[docs/STATUS.md](docs/STATUS.md) 看每项的真实状态。

## 🗺️ Roadmap（简版，详情见 [ROADMAP.md](ROADMAP.md)）

- ✅ 已完成：断点续跑、结构化日志、配置校验、核心路径测试、Obsidian Sink、自适应限流。
- 🚧 正在增强：抖音→Obsidian 分层整理、失败恢复、B 站采集覆盖与 Analyzer 路由。
- 📋 后续计划：YouTube、更多 Analyzer、知识图谱与本地 Web UI。
- 📌 每项能力的真实状态以 [docs/STATUS.md](docs/STATUS.md) 为准。

## 📁 项目结构

```text
reelloom/
├── src/collectors/       # 抖音与 B 站采集
├── src/analyzers/        # 豆包、Kimi 等 Analyzer
├── src/builders/         # 分类、去重与知识构建
├── src/core/             # 配置、断点、路由、限流与日志
├── src/sinks/            # Markdown / Obsidian 输出
├── scripts/              # 批处理、恢复与诊断工具
├── selectors/            # 页面选择器配置
├── docs/                 # 架构、状态与使用说明
├── .github/workflows/    # CI
├── package.json
└── README.md
```

## ⚠️ 负责使用

- 仅用于个人学习研究，不对平台造成负担
- 控制请求频率（建议每个视频间隔 5-10 秒）
- 不存储原视频文件，仅存储链接和结构化摘要
- 遵守各平台使用条款和 ToS
- 遇到验证码时停止自动化，人工处理

## 🤝 Contributing

欢迎贡献新的 Adapter、Analyzer 或 Sink！请参考 `docs/architecture.md` 了解接口规范。

1. Fork → Branch → Commit → PR
2. 新增平台 Adapter：实现 `collect(collectionName)` 方法
3. 新增 Analyzer：实现 `analyze(video, attachments)` 方法
4. 新增 Sink：实现 `sink(knowledgeBase)` 方法

## 📜 License

[MIT](LICENSE) — 自由使用、修改、分发。

---

<a id="english"></a>

## 🎯 One-Line Pitch

Turn your Douyin/Bilibili video favorites into a searchable, linkable, reusable knowledge base with a local Agent, browser-assisted analysis, and Markdown/Obsidian output.

## 🤔 Why This Project

Your favorites are gathering dust.

- You saved hundreds of tutorial videos, but never systematically watched them
- You want to learn AI / coding / design, but don't know where to start
- Watching them all would take dozens of hours

**The traditional approach has fatal flaws:**

| Step | Problem |
|------|---------|
| Download videos | Douyin has **download protection** — many videos can't be saved locally |
| Transcribe audio | Whisper requires GPU; cloud APIs charge per minute |
| Analyze content | Cloud and web model pricing, quotas, and limits can change |
| Organize into KB | Manual classification and summarization is painfully slow |

**ReelLoom's approach: no local video archive, browser-assisted analysis, and local-first knowledge output.**

When you are already logged into supported services, the local Agent can coordinate authorized browser interactions and turn the resulting analysis into local knowledge files. Service availability, pricing, quotas, and automation permissions remain controlled by each provider.

## 🏆 Verified Results

| Metric | Value |
|--------|-------|
| Douyin "skills" collection scraped | **76 videos** |
| Doubao analysis | **76 saved items produced usable output**; processing records include retries and multiple result levels |
| Comments extracted | 71 |
| Speech-to-text obtained | 69 |
| Auto-categorized | 8 categories |
| Synced to Lexiang KB | 6 pages |
| **API cost in this run** | **$0**; not a promise of permanent third-party pricing |

See a [sanitized example knowledge card](examples/sample-knowledge-card.md) to inspect the local output format without signing in to any platform.

> The 76-item run produced usable output for every saved item. Processing records include retries and multiple output levels, so raw record counts are not presented as a success percentage.

## 💡 Cost and dependency model

ReelLoom itself is open source. Runtime cost depends on the browser services,
account quotas, APIs, or local models selected by the user. One documented
76-item run incurred no API cost; this is not a promise about future
third-party pricing or availability.

**How?**

1. **No local video archive** — ReelLoom works with information available in the user's authenticated browser session and keeps structured knowledge output locally.
2. **Reuse your logged-in browser** — Chrome CDP :9222 connects to your real browser session.
3. **Use authorized web AI access** — availability, quotas, pricing, and automation permissions depend on each provider's current terms.
4. **Local Agent orchestrates** — Task planning, prompt assembly, result merging, and local knowledge output remain on the user's machine.

## 🚀 Quick Start

```bash
git clone https://github.com/yanyu612/reelloom.git
cd reelloom && npm install

# Start Chrome with remote debugging
chrome --remote-debugging-port=9222

# Collect → Analyze → Build → Sync
node src/cli.mjs collect --platform douyin --collection skills
node src/cli.mjs analyze --analyzer doubao
node src/cli.mjs build
node src/cli.mjs sync --sink markdown
```

## 📊 Skill-Focused Analysis Framework (10 Dimensions)

Each video is analyzed as a **learnable skill unit**, not just summarized:

| # | Dimension | Description | Example |
|---|-----------|-------------|---------|
| 1 | **Skill Name** | What specific skill the video teaches | "Claude 10x Learning Method" / "Firecrawl Free Scraping" |
| 2 | **Skill Level** | Beginner/Intermediate/Advanced/Expert | 5-tier scale |
| 3 | **Key Points** | 3-5 must-remember takeaways | "6-step learning loop", "80/20 core focus" |
| 4 | **Action Steps** | Follow-along step-by-step instructions | Step 1 → Step 2 → ... |
| 5 | **Tools/Resources** | Specific tools or websites mentioned | AgentChat / Firecrawl / Claude |
| 6 | **Pitfalls** | Common mistakes the author warns about | "Don't use Claude as search engine" |
| 7 | **Use Cases** | When to apply this skill | AI automation / web data collection |
| 8 | **Prerequisites** | What you need to know first | Basic Python / Agent architecture |
| 9 | **Learning Path** | Which videos to combine for best results | "Watch #3 first → then #7" |
| 10 | **Auto Tags** | Machine-generated classification tags | `#AI-Agent` `#Scraper` `#OpenSource` |

## 🎯 Douyin-Specific Capabilities

### No local video archive
ReelLoom operates on page-visible information in the user's authenticated browser session and does not add original video files to the knowledge base.

### Tag/Topic Extraction
Douyin videos come with topic tags such as `#AI`, `#Coding`, and `#OpenSource`. ReelLoom uses page-visible tags as initial classification input, then refines them with analysis results.

### Comment Harvesting
When the user is authorized to process them and the page allows access, ReelLoom can use a limited number of visible comments as auxiliary analysis material. It rate-limits requests and stops on CAPTCHA.

### Speech Understanding
Web AIs like Doubao can directly understand video speech content, no local Whisper transcription needed.

## 🔌 Support Matrix

### Video Platforms (Collector)

| Platform | Special Features | Status |
|----------|-----------------|--------|
| Douyin | Page collection + Tags + Comments | ✅ MVP verified (76 videos) |
| Bilibili | Danmaku + Multi-part + UP info | 📋 Phase 2 |
| YouTube | CC subtitles + Chapters + Long video | 📋 Phase 2 |
| Xiaohongshu | Image-text notes + Tags | 🔮 Future |

### Web AI (Analyzer)

| AI | Strengths | Cost | Rate Limit | Status |
|----|-----------|------|------------|--------|
| Doubao | Chinese understanding, skill analysis | Free | None | ✅ Verified |
| Kimi | Long context, deep reading | Free | None | 📋 Phase 2 |
| Gemini | Multimodal, English | Free | Limited | 📋 Phase 2 |
| Claude | Structured output, code logic | Free tier | Limited | 📋 Phase 2 |

### Knowledge Base (Sink)

| KB | Status |
|----|--------|
| Lexiang | ✅ 6 pages synced |
| Markdown | ✅ Implemented |
| Obsidian | ✅ Basic |
| Notion | 📋 Phase 3 |

## 🗺️ Roadmap

- **Phase 1 ✅** — Douyin page collector + Doubao analyzer (skill-focused 10-dim) + Knowledge builder + Markdown/Lexiang sink
- **Phase 2 📋** — Bilibili/YouTube adapters + Kimi/Gemini/Claude analyzers + Parallel mode
- **Phase 3 📋** — Knowledge graph visualization + Notion/Obsidian connectors + Local Web UI
- **Phase 4 🔮** — Plugin marketplace + Cloud deployment (optional)

## ⚠️ Responsible Use

- Personal learning only; don't overload platforms
- Rate-limit requests (5-10s per video)
- Store only links and summaries, never original video files
- Stop automation on CAPTCHA; handle manually
- Respect platform ToS

## 📜 License

[MIT](LICENSE)
