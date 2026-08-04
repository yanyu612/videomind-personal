/**
 * Knowledge Builder — Merge, deduplicate, categorize, and structure video analyses
 * 
 * MVP validated: 85 videos → 8 categories → structured knowledge base
 */

export class KnowledgeBuilder {
  constructor(options = {}) {
    this.categories = options.categories || DEFAULT_CATEGORIES;
    this.includeAll = options.includeAll === true;
  }

  /**
   * Build a structured knowledge base from raw analysis results
   */
  build(analyses) {
    // Step 1: Filter AI-relevant content
    const aiRelevant = this.includeAll ? analyses : analyses.filter(a => this.isAIRelevant(a));

    // Step 2: Auto-categorize
    const categorized = this.categorize(aiRelevant);

    // Step 3: Deduplicate (same topic covered by multiple videos)
    const deduplicated = this.deduplicate(categorized);

    // Step 4: Generate knowledge base JSON
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        total: analyses.length,
        deepAnalysis: aiRelevant.length,
        aiRelevant: aiRelevant.length,
      },
      categoryDistribution: this.getDistribution(deduplicated),
      categories: deduplicated,
    };
  }

  isAIRelevant(analysis) {
    const aiKeywords = ['AI', 'agent', 'LLM', 'GPT', 'Claude', 'Gemini', '开源', '编程', 'vibecoding', '自动化'];
    const text = (analysis.analysis || '').toLowerCase();
    return aiKeywords.some(k => text.includes(k.toLowerCase()));
  }

  categorize(analyses) {
    const result = {};
    const assigned = new Set();

    // First pass: assign each video to at most ONE specific category
    // (the first category whose keywords match). Videos that match no
    // specific category will be caught by the catch-all below.
    const specificCats = this.categories.filter(c => c.keywords.length > 0);
    for (const cat of specificCats) {
      result[cat.name] = analyses.filter(a => {
        if (assigned.has(this._key(a))) return false;
        if (this.matchesCategory(a, cat)) {
          assigned.add(this._key(a));
          return true;
        }
        return false;
      });
    }

    // Catch-all: any remaining video goes into the first category with
    // empty keywords (typically "其他"). Without this, videos that don't
    // match any specific category are silently DROPPED.
    const catchAll = this.categories.find(c => c.keywords.length === 0);
    if (catchAll) {
      result[catchAll.name] = analyses.filter(a => !assigned.has(this._key(a)));
    }

    return result;
  }

  matchesCategory(analysis, category) {
    const text = [
      analysis.title,
      analysis.analysis,
      ...(analysis.tags || []),
      ...(analysis.dimensions?.auto_tags || []),
      ...(analysis.dimensions?.key_points || [])
    ].filter(Boolean).join(' ').toLowerCase();
    return category.keywords.some(k => text.includes(k.toLowerCase()));
  }

  /**
   * Stable identity key for an analysis (used to track "already assigned"
   * across categories). Falls back to title if URL is missing.
   */
  _key(analysis) {
    return analysis.url || analysis.title || JSON.stringify(analysis).slice(0, 200);
  }

  deduplicate(categorized) {
    // Simple dedup: within each category, remove videos with >80% title similarity
    const result = {};
    for (const [cat, videos] of Object.entries(categorized)) {
      result[cat] = this.removeSimilarTitles(videos);
    }
    return result;
  }

  removeSimilarTitles(videos) {
    if (videos.length <= 1) return videos;

    const SIMILARITY_THRESHOLD = 0.6;
    const kept = [];
    const mergedRefs = new Map(); // title → [urls merged into it]

    for (const video of videos) {
      const title = (video.title || '').trim();
      let bestMatch = null;
      let bestScore = 0;

      for (const existing of kept) {
        const score = this.titleSimilarity(title, existing.title);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = existing;
        }
      }

      if (bestScore >= SIMILARITY_THRESHOLD && bestMatch) {
        // Merge: keep the one with more content, add the other as reference
        const refs = mergedRefs.get(bestMatch.title) || [];
        refs.push(video.url);
        mergedRefs.set(bestMatch.title, refs);
        // If the duplicate has more analysis content, swap
        if ((video.analysis || '').length > (bestMatch.analysis || '').length) {
          const idx = kept.indexOf(bestMatch);
          kept[idx] = video;
          mergedRefs.set(video.title, refs);
        }
      } else {
        kept.push(video);
      }
    }

    // Attach merged references to kept videos
    for (const video of kept) {
      video.mergedUrls = mergedRefs.get(video.title) || [];
    }

    return kept;
  }

  /**
   * Levenshtein-based title similarity (0.0 — completely different, 1.0 — identical)
   */
  titleSimilarity(a, b) {
    if (!a || !b) return 0;
    const la = a.length, lb = b.length;
    if (la === 0) return lb === 0 ? 1 : 0;
    if (lb === 0) return 0;

    // Truncate very long titles for performance
    const maxLen = 100;
    const sa = a.slice(0, maxLen).toLowerCase();
    const sb = b.slice(0, maxLen).toLowerCase();

    const dist = this.levenshteinDist(sa, sb);
    return 1 - dist / Math.max(sa.length, sb.length);
  }

  /**
   * Standard Levenshtein distance (Wagner-Fischer algorithm)
   */
  levenshteinDist(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    dp[0] = Array.from({ length: n + 1 }, (_, j) => j);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }
    return dp[m][n];
  }

  getDistribution(categorized) {
    const dist = {};
    for (const [cat, videos] of Object.entries(categorized)) {
      dist[cat] = videos.length;
    }
    return dist;
  }
}

const DEFAULT_CATEGORIES = [
  { name: 'AI Agent与工作流', keywords: ['agent', 'workflow', 'subagent', '自动化', '编排'] },
  { name: '大语言模型与推理', keywords: ['LLM', 'GPT', '推理', '语言模型', 'prompt'] },
  { name: 'AI编程工具(VibeCoding)', keywords: ['vibecoding', '编程', '代码', 'IDE', 'copilot'] },
  { name: '开源工具与项目', keywords: ['开源', 'GitHub', 'star', 'repository'] },
  { name: 'AI应用与落地', keywords: ['应用', '落地', '行业', '案例', '实践'] },
  { name: 'AI视频与多媒体', keywords: ['视频', '多媒体', '数字人', '生成', '3D'] },
  { name: 'AI设计', keywords: ['设计', 'UI', '交互', '视觉'] },
  { name: '其他', keywords: [] },
];

export const GENERAL_CATEGORIES = [
  { name: 'AI与数码技术', keywords: ['ai', 'agent', 'llm', 'gpt', 'claude', '编程', '代码', '开源', 'github', '电脑', '手机', '数码', '软件'] },
  { name: '学习与考试', keywords: ['考研', '考试', '数学', '英语', '政治', '学习', '背单词', '课程', '知识', '读书'] },
  { name: '工作·管理与副业', keywords: ['职场', '面试', '工作', '管理', '副业', '创业', '运营', '自媒体', '赚钱', '商业'] },
  { name: '理财与消费决策', keywords: ['理财', '资产', '基金', '股票', '消费', '价格', '省钱', '避坑', '购买'] },
  { name: '家居·清洁与收纳', keywords: ['家居', '保洁', '清洁', '收纳', '装修', '家务', '洗衣', '厨房', '卫生间'] },
  { name: '美食与做饭', keywords: ['美食', '做饭', '菜谱', '食谱', '烘焙', '食材', '餐厅', '咖啡', '奶茶'] },
  { name: '健康·运动与身体', keywords: ['健康', '运动', '健身', '减肥', '减脂', '跑步', '睡眠', '疾病', '医院', '药'] },
  { name: '穿搭·护肤与变美', keywords: ['穿搭', '衣服', '护肤', '化妆', '发型', '香水', '显瘦', '变美'] },
  { name: '情绪·关系与成长', keywords: ['情绪', '心理', '恋爱', '关系', '沟通', '成长', '焦虑', '孤独', '人生'] },
  { name: '旅行与本地生活', keywords: ['旅行', '旅游', '酒店', '景点', '路线', '城市', '探店', '交通'] },
  { name: '影视·音乐与娱乐', keywords: ['电影', '电视剧', '综艺', '音乐', '游戏', '动漫', '小说', '明星', '娱乐'] },
  { name: '社会观察与观点', keywords: ['社会', '新闻', '观点', '历史', '文化', '经济', '教育', '观察'] },
  { name: '待实践与工具清单', keywords: ['教程', '步骤', '方法', '清单', '工具', '安装', '操作', '实操'] },
  { name: '其他收藏', keywords: [] },
];
