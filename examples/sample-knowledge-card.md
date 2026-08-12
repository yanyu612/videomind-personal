---
type: video-knowledge-card
source_platform: demo
source_url: https://example.com/video/demo
title: 用断点与日志维护长任务
category: AI-工程实践
skill_level: 入门
confidence: 0.92
tags:
  - 断点续跑
  - 结构化日志
  - 任务恢复
---

# 用断点与日志维护长任务

> 这是 ReelLoom 的脱敏示例输出，不对应任何真实账号或收藏内容。

## 技能名称

为批量处理任务设计可恢复的执行流程。

## 核心要点

- 每个条目都有稳定 ID 与明确状态。
- 成功结果即时落盘，失败原因单独记录。
- 重启后只继续未完成或允许重试的条目。
- 日志包含批次 ID、阶段、组件和时间。

## 实操步骤

1. 建立 pending / running / completed / failed 状态机。
2. 每完成一个条目就更新 checkpoint。
3. 对可重试错误使用有上限的退避。
4. 在最终报告中区分条目数、处理记录数和重试数。

## 避坑指南

- 不要用“处理记录条数”冒充“唯一条目成功数”。
- 不要把 Cookie、Token 或私有路径写入日志。
- 遇到 CAPTCHA 时停止自动化并交给用户处理。

## 适用场景

- 视频收藏批量整理
- 文档迁移
- 长时间网页采集
- 可中断的本地 Agent 工作流

## 前置知识

- 基础 Node.js
- JSON / Markdown
- 简单的状态机概念

## 学习路径

先理解 checkpoint，再补结构化日志、退避策略与人工恢复入口。

## 关联

- [[AI-工程实践]]
- [[任务恢复]]
- [[结构化日志]]
