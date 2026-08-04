/**
 * Doubao Analyzer — Use Doubao (doubao.com) as Web-SubAgent for video analysis
 *
 * MVP validated: 77/76 videos = 100% coverage (49 deep + 28 enhanced basic)
 *
 * SeniorDeveloper: 重构为继承 BaseAnalyzer，消除与 kimi.mjs 的重复代码。
 * 原始逻辑来自 MiniMax M3 (Round 4/8)，retry/JSON解析/10维输出移到基类。
 *
 * Round 8 改造:
 *   - 改用 selectors/doubao.json (配置化 selector + 备选链)
 *   - 改用 dom-watcher.mjs 智能等待 (替代硬编码 30s)
 */

import { BaseAnalyzer } from '../core/base-analyzer.mjs';
import { waitForElement, captureFailure } from '../core/selector.mjs';
import { NotLoggedInError } from '../core/analyzer-errors.mjs';
import { uploadThumbToEditor } from '../core/thumb-upload.mjs';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function responseAfterLastMatchingPrompt(messages, videoUrl) {
  const id = String(videoUrl || '').match(/\d{10,}/)?.[0] || String(videoUrl || '');
  let waitingForAnswer = false;
  let candidate = '';
  for (const message of messages || []) {
    if (message.isUser) {
      waitingForAnswer = Boolean(id && message.text.includes(id));
      if (waitingForAnswer) candidate = '';
    } else if (waitingForAnswer) {
      candidate = message.text || '';
      waitingForAnswer = false;
    }
  }
  return candidate;
}

function buildKnowledgeCardPrompt(video, options = {}) {
  const tags = video.tags?.join(', ') || '无';
  const comments = video.comments?.slice(0, 5).map(c =>
    typeof c === 'string' ? c : `${c.author}: ${c.text}`
  ).join('\n') || '无';
  const imageNote = options.thumbUploaded
    ? '已附封面图，可作为辅助信息。'
    : '未附封面图，请优先打开原链接读取视频。';

  return `你是一位严谨的个人知识整理员。请打开抖音原链接，读取视频实际画面、字幕、语音和文案，把它整理成适合 Obsidian 的知识卡数据。

视频信息：
- 原链接：${video.url}
- 标题：${video.title || '未知'}
- 作者：${video.author || '未知'}
- 标签：${tags}
- 评论：${comments}
- 已有转写：${video.transcript || '无'}
- ${imageNote}

真实性要求：必须先尝试访问原链接。不得仅凭标题猜测或补写事实。若无法读取，将 access_status 写为“无法读取”，transcript 写“未能读取视频”，不确定字段留空。

整理要求：
1. content_type 从“菜谱、运动、AI工具、学习、家居清洁、健康、美妆、理财、旅行、娱乐、观点鸡汤、其他”中选择。
2. 生成一级分类、二级分类和 2～5 个主题词，作为 Obsidian 双链节点。
3. 写一句话总结、3～6 个核心要点、适用与不适用场景、可执行动作、保留理由和待验证内容。
4. category_details 仅使用相应类型字段：
   菜谱：dish、ingredients、steps、time_heat、substitutions、pitfalls；
   运动：goal、exercises、dosage、form_cues、contraindications、regression_progression；
   AI工具：tool、problem_solved、steps、cost_requirements、limitations；
   家居清洁：cleaning_target、materials、steps、safety、pitfalls；
   观点鸡汤：core_claim、reasoning、useful_part、emotional_rhetoric、counterexamples；
   其他：scene、method、steps、boundaries。
5. transcript 尽量记录完整口播；听不清标“（听不清）”，无口播写“无旁白”。

只返回合法 JSON，不要代码块或解释：
{"access_status":"已读取|部分读取|无法读取","evidence":["字幕","语音","画面","文案"],"title":"短标题","content_type":"","category_primary":"","category_secondary":"","summary":"","key_points":[""],"suitable_for":"","not_suitable_for":"","action_items":[""],"retention_reason":"","to_verify":[""],"topics":[""],"knowledge_points":[""],"related_search_terms":[""],"category_details":{},"transcript":"","auto_tags":["#标签"]}`;
}

export class DoubaoAnalyzer extends BaseAnalyzer {
  constructor(context, options = {}) {
    // SeniorDeveloper: 基类接管 context、limiter、logger、selectors 初始化
    super(context, { ...options, platform: 'doubao', maxRetries: options.maxRetries ?? 2 });
    this.url = 'https://doubao.com';
    this.page = null;
    this.conversationStatePath = resolve('data', 'doubao-conversation.json');
    this.unreadableRetryUrls = new Set();
  }

  _savedConversationUrl() {
    try {
      if (!existsSync(this.conversationStatePath)) return null;
      const state = JSON.parse(readFileSync(this.conversationStatePath, 'utf8'));
      return /^https:\/\/(www\.)?doubao\.com\/chat\/.+/.test(state.url || '') ? state.url : null;
    } catch { return null; }
  }

  _rememberConversation(page) {
    const url = page.url();
    if (!/^https:\/\/(www\.)?doubao\.com\/chat\/.+/.test(url)) return;
    try {
      mkdirSync(dirname(this.conversationStatePath), { recursive: true });
      writeFileSync(this.conversationStatePath, JSON.stringify({ url, savedAt: new Date().toISOString() }, null, 2), 'utf8');
    } catch { /* non-fatal: this batch can still continue on the same page */ }
  }

  async _getConversationPage() {
    if (this.page && !this.page.isClosed()) return { page: this.page, isNew: false };
    this.page = await this.context.newPage();
    await this.page.goto(this._savedConversationUrl() || this.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return { page: this.page, isNew: true };
  }

  /**
   * Single attempt at analyzing a video.
   * SeniorDeveloper: 纯平台特有逻辑，retry 循环和解析由基类处理。
   */
  async _doAnalyze(video, attachments = []) {
    const { page, isNew } = await this._getConversationPage();
    const log = this.logger;
    try {
      // SeniorDeveloper: Round 11 — 登录态检测，未登录时抛 NotLoggedInError
      // 让 Router 正确 fallback 到下一个 analyzer，而非浪费 retries
      if (isNew) await this._checkLoginState(page);

      // 等输入框出现 (替代硬编码 selector)
      const inputResult = await waitForElement(page, this.selectors.chatInput, {
        intervals: [3000, 5000],
        scrollTrigger: false,
        logger: log
      });
      if (!inputResult.element) {
        log?.error?.({ attempts: inputResult.attempts }, 'chat input not found');
        await captureFailure(page, 'no-chat-input', { logger: log });
        throw new Error('chat input not found — selectors/doubao.json may be outdated');
      }

      // Round 22 / Round 11 复活: 上传缩略图 (抖音 URL 被反爬虫, 缩略图是 AI 唯一能 '看' 的)
      let thumbUploaded = false;
      if (video.thumb || video.cover_url) {
        thumbUploaded = await uploadThumbToEditor(page, inputResult.element, video, {
          editorSelector: 'textarea.semi-input-textarea, div[contenteditable="true"]',
          logger: log
        });
      }

      // 构造 prompt + 输入
      const prompt = this.buildPrompt(video, { thumbUploaded });
      const responseSelector = this.selectors.responseContainer.primary;
      await inputResult.element.fill(prompt);
      await new Promise(r => setTimeout(r, 500));

      // 尝试找发送按钮，fallback 按 Enter
      const sendResult = await waitForElement(page, this.selectors.sendButton, {
        intervals: [1000, 2000],
        scrollTrigger: false,
        logger: log
      });
      if (sendResult.element) {
        await sendResult.element.click();
      } else {
        log?.warn?.({ prompt: prompt.slice(0, 50) }, 'no send button, pressing Enter');
        await inputResult.element.press('Enter');
      }

      // A strict JSON response is complete as soon as it parses. Waiting for
      // three 8-second text-stability polls caused a needless 24-32s gap in
      // which a user could close the batch after seeing the answer but before
      // it was committed.
      log?.debug?.({ selector: responseSelector }, 'waiting for complete AI JSON response');
      const t0 = Date.now();
      const waitingHeartbeat = setInterval(() => {
        const seconds = Math.floor((Date.now() - t0) / 1000);
        console.log(`  ⏳ 豆包仍在生成，本条已等待 ${seconds} 秒（程序仍在运行）`);
      }, 15000);
      let responseText;
      try {
        const deadline = Date.now() + 600000;
        while (Date.now() < deadline) {
          const candidate = await this._latestResponseForVideo(responseSelector, video.url);
          const parsed = this.tryParseJSON(candidate);
          if (parsed && parsed.title && (parsed.access_status || parsed.summary)) {
            responseText = candidate;
            break;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        if (!responseText) throw new Error('timed out waiting for a complete JSON response');
      } finally {
        clearInterval(waitingHeartbeat);
      }
      log?.info?.({ took: Date.now() - t0, len: responseText.length }, 'AI response captured');
      this._rememberConversation(page);

      const structured = this.tryParseJSON(responseText);
      if (structured?.access_status === '无法读取') {
        this.unreadableRetryUrls.add(video.url);
        const error = new Error('豆包未能读取视频，自动重新尝试一次');
        error.code = 'VIDEO_UNREADABLE';
        throw error;
      }
      this.unreadableRetryUrls.delete(video.url);
      return this.parseResponse(video, responseText);
    } catch (e) {
      log?.error?.({ err: e.message, video: video.url }, '_doAnalyze failed');
      await captureFailure(page, 'analyze-failed', { logger: log });
      throw e;
    } finally {
      // Doubao may open referenced GitHub/project links in child tabs while
      // reading a video. Close only popups owned by this analysis page so they
      // never steal focus or remain after the task.
      for (const candidate of this.context.pages()) {
        if (candidate === page) continue;
        const opener = await candidate.opener().catch(() => null);
        if (opener === page) await candidate.close().catch(() => {});
      }
      // Keep this page for the next video. The batch-level disconnect closes
      // it after all requested videos have been processed.
    }
  }

  async _assistantResponseTexts(page, selector) {
    return page.locator(selector).evaluateAll(nodes => nodes
      .filter(node => {
        const grandClass = String(node.parentElement?.parentElement?.className || '');
        return !grandClass.includes('send-msg-bubble');
      })
      .map(node => node.textContent || '')
    ).catch(() => []);
  }

  async _latestResponseForVideo(selector, videoUrl) {
    let candidate = '';
    for (const candidatePage of this.context.pages()) {
      if (!candidatePage.url().includes('doubao.com')) continue;
      // Doubao currently renders assistant replies in two different DOMs:
      // older turns use .md-box-root while fresh/generated turns can use
      // .flow-markdown-body. Read both in document order so a visible answer
      // is not missed merely because Doubao switched renderer mid-chat.
      const messageSelector = `${selector}, .flow-markdown-body, [class*="flow-markdown-body"]`;
      const messages = await candidatePage.locator(messageSelector).evaluateAll(nodes => nodes.map(node => ({
        text: node.textContent || '',
        isUser: [node, node.parentElement, node.parentElement?.parentElement, node.parentElement?.parentElement?.parentElement]
          .some(ancestor => String(ancestor?.className || '').includes('send-msg-bubble')),
      }))).catch(() => []);
      const found = responseAfterLastMatchingPrompt(messages, videoUrl);
      if (found) candidate = found;
    }
    return candidate;
  }

  /**
   * SeniorDeveloper: Round 11 — 检测用户是否已登录 doubao.com
   *
   * 检查登录按钮等 UI 元素，如果页面处于未登录态则抛 NotLoggedInError。
   * 让 Router 正确 fallback 到 Kimi 等已登录的 analyzer，而非浪费 retries。
   *
   * 判定依据：未登录时 doubao.com 会在页面顶部显示登录/注册按钮或全屏登录引导页。
   */
  async _checkLoginState(page) {
    const loginSelectors = [
      'button:has-text("登录")',
      'a:has-text("登录")',
      'button:has-text("注册")',
      'button:has-text("免费使用")',
      '[class*="login"]',
      '[class*="LoginModal"]',
    ];

    for (const selector of loginSelectors) {
      try {
        const el = page.locator(selector).first();
        const visible = await el.isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          const text = (await el.textContent().catch(() => '')).trim().slice(0, 30);
          this.logger.info?.({ selector, text }, 'login button detected — user not logged in');
          // 截图保留现场
          await captureFailure(page, 'not-logged-in', { logger: this.logger }).catch(() => {});
          throw new NotLoggedInError('doubao', `login button visible: "${text}" (selector: ${selector})`);
        }
      } catch (e) {
        if (e instanceof NotLoggedInError) throw e;
        // 超时或元素不存在 → 正常，继续检查
      }
    }

    this.logger.debug({}, 'login state check passed — user appears logged in');
  }

  buildPrompt(video, options = {}) {
    const retryNote = this.unreadableRetryUrls.has(video.url)
      ? '这是第二次读取尝试。上一次未能读取视频，请重新打开原链接，等待视频加载后读取画面、字幕、语音和文案；不要沿用上一次的“无法读取”回答。\n\n'
      : '';
    return retryNote + buildKnowledgeCardPrompt(video, options);
    const videoTags = video.tags?.join(', ') || '无';
    const topComments = video.comments?.slice(0, 5).map(c =>
      typeof c === 'string' ? c : `${c.author}: ${c.text}`
    ).join('\n') || '无';
    // Round 22 / Round 11 复活: 提示 AI 已经收到封面图 + 评论
    const thumbUploaded = options.thumbUploaded === true;

    return `你是一位技能拆解专家。请将以下视频当作一个「可学习的技能单元」来深度分析。

## 视频信息
- 抖音原链接：${video.url}
- 标题：${video.title}
- 作者：${video.author}
- 话题标签：${videoTags}
- 精选评论：
${topComments}
- 语音转写：${video.transcript || '无'}
${thumbUploaded ? '- 已附上视频封面图，请结合原链接、画面、语音、字幕、评论和标签分析' : '- 未附加封面图，请优先打开并读取上面的抖音原链接，基于视频实际画面、语音和字幕分析'}

请先尝试访问抖音原链接并理解视频实际内容。不要只根据标题猜测；如果链接确实无法读取，请在 transcript 中明确写“未能读取视频，仅依据标题和标签”，不得编造逐字稿。

## 分析要求（10维度技能框架）

请按以下10个维度输出结构化分析：

1. **技能名称** — 这个视频教的具体是什么技能？用一句话命名（如"Claude 10倍速学习法"、"Firecrawl免API爬取"）
2. **技能等级** — 入门/中级/高级/专家？5级量表
3. **核心要点** — 3-5个必须记住的关键知识点
4. **实操步骤** — 可以直接照做的分步骤清单（Step 1 → Step 2 → ...）
5. **工具/资源** — 视频提到了哪些具体工具、网站、项目？
6. **避坑指南** — 作者提醒了哪些常见错误和陷阱？
7. **适用场景** — 在什么情况下需要用这个技能？
8. **前置知识** — 学这个技能之前需要先掌握什么？
9. **学习路径** — 建议跟哪些类型的视频组合学习效果更好？
10. **关键词标签** — 3-5个自动分类标签（如 #AI-Agent #爬虫 #开源工具）

每个维度请给出具体、可操作的内容，不要泛泛而谈。

## 输出格式（严格 JSON）

请**仅**以一个合法的 JSON 对象回复，不要包含任何其他文字、Markdown 代码块标记或解释。格式如下：

{"skill_name":"...","skill_level":"入门|中级|高级|专家","key_points":["...", "..."],"action_steps":["...", "..."],"tools_resources":["...", "..."],"pitfalls":["...", "..."],"use_cases":"...","prerequisites":"...","learning_path":"...","transcript":"...","auto_tags":["#tag1", "#tag2"]}

- 字符串值用中文
- 数组值用 ["项1", "项2"] 格式
- 缺失信息填 "" 或 []
- **transcript 字段：把视频里所有听得到的口语逐字记录下来**（原话+关键旁白），如听不清可填"(听不清)"，但尽量用连贯的文段还原。如果视频里没有口头讲解，标"无旁白"
- 不要使用 markdown 代码块包裹
- 不要添加任何说明文字`;
  }
}
