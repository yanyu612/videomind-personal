# ReelLoom — Codex for OSS 申请材料

更新日期：2026-08-12

申请仓库：https://github.com/yanyu612/reelloom

官方申请表：https://openai.com/zh-Hant-HK/form/codex-for-oss/

## 结论

ReelLoom 已具备真实代码、公开许可证、持续提交、CI、正式 Release 和端到端使用记录。
技术与公开资料层面已可提交；主要弱项是社区采用量仍小，申请时应如实说明。

建议提交门槛：

1. GitHub 个人资料补充公开显示名称与一句维护者简介；
2. 宝宝本人核对姓名、ChatGPT 邮箱和 OpenAI organization ID；
3. 申请材料只使用下列真实数据，不虚构采用量。

## 项目简介（中文）

ReelLoom 是一个 local-first 的视频收藏知识整理工具。它通过本地 Node.js
Agent 编排用户已授权的浏览器会话，把抖音和 B 站收藏条目转成结构化、可检索、
可链接的 Markdown / Obsidian 知识。项目重点不是生成一次性视频摘要，而是将每个
视频拆成技能、前置知识、操作步骤、适用场景和关联路径，并提供断点续跑、限流、
失败恢复、分层分类和 Analyzer 仲裁。

ReelLoom 基于 MIT 许可的 `HU1234top/videomind` 发展而来，保留原许可证与来源说明，
由当前仓库独立维护。现阶段最充分验证的路径是抖音收藏到 Obsidian；其他平台能力
按 `docs/STATUS.md` 如实标注，不把规划写成已完成。

## Project description (English)

ReelLoom is a local-first, open-source pipeline that turns saved video items
into structured, searchable knowledge. A local Node.js agent coordinates
authorized browser sessions, analyzers, checkpoints, builders, and
Markdown/Obsidian sinks. Instead of producing one-off summaries, ReelLoom
models each video as a learnable unit with skills, prerequisites, action steps,
pitfalls, use cases, tags, and links to related material.

The project includes resumable processing, adaptive rate limiting, structured
logs, recovery utilities, hierarchical classification, analyzer routing, and
automated tests. Its most thoroughly verified workflow is Douyin-to-Obsidian;
other platform support is explicitly labeled by implementation status.

ReelLoom is an independently maintained derivative of
HU1234top/videomind under the MIT License. The repository preserves attribution
and documents the maintained fork's distinct direction and changes.

## 真实项目数据（申请时重新核对）

截至 2026-08-12：

- Public repository：是
- License：MIT
- Git commits：50（含 ReelLoom 公开身份与示例文档提交；申请前再次核对）
- Automated tests：369 passed, 0 failed（本机完整测试）
- GitHub Actions：最近连续成功；早期失败记录保留，未伪装
- GitHub Stars：1
- Forks：0
- Issues：0
- Pull requests：0
- GitHub Releases：1（`v0.2.0`）
- Tags：3（含 `v0.2.0`）
- 真实端到端记录：一次 76 条抖音收藏整理产生可用知识输出
- Contributors：2（GitHub API 统计）

说明：分析过程存在重试及不同输出等级，因此不再使用“77/76 = 100%”作为宣传口径。

## 为什么值得进入 Codex for OSS（中文要点）

- 解决中文视频收藏难以沉淀为个人知识的具体问题；
- 输出为开放的 Markdown / Obsidian 文件，用户可以迁移和长期保存；
- 浏览器自动化天然容易因页面变化而维护，持续需要 selector 修复、回归测试、
  issue 分流和发布管理，符合 Codex 辅助开源维护的实际场景；
- 项目已有真实使用路径、恢复工具和 369 项自动测试，不是只写 README 的概念项目；
- 诚实承认当前社区采用量很小，申请依据是维护负担和生态空缺，不是虚构影响力。

## Form answer: Why does this repository qualify? (English draft)

I am the primary maintainer of ReelLoom, a local-first open-source pipeline
that turns saved Douyin and Bilibili video items into structured
Markdown/Obsidian knowledge. The project addresses a practical gap for users
whose learning material lives in short-video collections but cannot be
searched, linked, or reused as durable knowledge.

The repository has 48 commits, an MIT license, CI, and 369 passing automated
tests. A real end-to-end run processed 76 saved Douyin items into usable local
knowledge output. The system includes checkpoints, adaptive rate limiting,
structured logging, recovery tools, hierarchical classification, and analyzer
routing. Browser-driven collectors require ongoing maintenance as pages and
selectors change, making regression testing, issue triage, review, and release
work central to the project.

ReelLoom is an independently maintained derivative of HU1234top/videomind and
preserves the upstream MIT license and attribution. I do not claim broad
adoption: the repository currently has 1 star and no public download metric.
Its value is a reproducible, open, Chinese-first workflow and portable local
output for a problem underserved by conventional video-summary tools.

## Form answer: How will API credits be used? (English draft)

I would use API credits for open-source maintenance rather than user-content
processing. Planned uses include reviewing pull requests, generating and
improving regression tests for collector and selector changes, triaging
sanitized failure logs, reproducing parser edge cases, documenting migrations,
and preparing release notes.

ReelLoom's browser integrations change frequently when provider pages evolve.
Codex-assisted maintenance would help compare sanitized DOM snapshots, propose
small selector patches, verify that CAPTCHA and rate-limit safeguards remain
intact, and add targeted tests before merging. Credits would also support
security review of browser-session boundaries and refactoring platform-specific
collectors behind stable interfaces.

The goal is to shorten the time from a reported breakage to a tested fix while
keeping human review, transparent commits, and CI as required gates.

## Form answer: Anything else we should know? (English draft)

ReelLoom is small and early-stage, and I prefer to state that plainly rather
than inflate stars, downloads, or user counts. The project already serves a
real personal knowledge workflow and has accumulated a substantial automated
test suite because browser automation and knowledge migration need careful
regression protection.

The maintained repository documents its upstream lineage and MIT attribution.
It also sets explicit safety boundaries: no committed browser sessions or
credentials, no CAPTCHA bypass, rate-limited automation, and local knowledge
output. Support status is documented separately from the roadmap so planned
features are not presented as shipped.

## 表单固定字段

- GitHub username：`yanyu612`
- Repository URL：`https://github.com/yanyu612/reelloom`
- Role：Primary maintainer
- Interest：Codex Security（如表单允许）
- Interest：API credits for the project
- OpenAI organization ID：`待宝宝从 platform.openai.com 核对`
- ChatGPT account email：`待宝宝填写，不写入仓库`
- First name / Last name：`待宝宝按证件或常用英文名填写`

## 提交前仍需补齐

- [x] 本轮文档修整提交并推送到 `yanyu612/reelloom`
- [x] GitHub Actions 对修整提交通过
- [x] 建立首个正式 Release，并写清已验证范围和已知限制
- [ ] GitHub 个人资料增加公开显示名称和简短 Bio
- [x] README 增加一份脱敏示例输出
- [ ] 重新核对 Star、commit、tests、contributors 等数字
- [ ] 宝宝本人填写姓名、ChatGPT 邮箱和 OpenAI organization ID

## 不应该写进申请的内容

- 虚构 Star、下载量、用户数、社区采用或收入；
- 把上游代码说成完全从零原创；
- 把规划中的 YouTube / Gemini / Claude 等能力写成已完整验证；
- 宣称第三方网页服务“永久免费、无限流”或暗示绕过平台保护；
- 把个人 ChatGPT 额度用途写成项目生态影响。
