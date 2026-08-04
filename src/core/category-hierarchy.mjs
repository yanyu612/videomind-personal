function text(value) {
  if (Array.isArray(value)) return value.join(' ');
  return String(value || '');
}

/**
 * Stable local taxonomy for Obsidian. AI-generated categories are useful as
 * hints, but broad folders must not fragment whenever Doubao invents a new
 * phrase for the same kind of content.
 */
export function categoryHierarchy(data = {}, row = {}) {
  const haystack = [
    data.content_type,
    data.category_primary,
    data.category_secondary,
    data.title,
    data.topics,
    data.auto_tags,
    row.title,
  ].map(text).join(' ');

  if (data.content_type === '家居清洁') return ['生活', '家庭管理', '清洁'];
  if (data.content_type === '菜谱') return ['生活', '烹饪', text(data.category_secondary) || '家常菜'];
  if (data.content_type === '运动') return ['生活', '运动健康', text(data.category_secondary) || '日常训练'];

  // Editing a face in an image is post-production, not personal care. Keep
  // this before the generic beauty rule because Doubao sometimes labels it 美妆.
  if (/(修图|液化|图片瘦脸|人像后期|照片后期|调色|Photoshop|Lightroom|醒图)/i.test(haystack)) {
    return ['生活', '摄影与修图', '人像修图'];
  }

  if (data.content_type === '健康') return ['生活', '健康管理', text(data.category_secondary) || '健康知识'];
  if (data.content_type === '美妆') return ['生活', '个人护理', text(data.category_secondary) || '美妆护肤'];
  if (data.content_type === '旅行') return ['生活', '旅行', text(data.category_secondary) || '旅行攻略'];

  const isEntertainment = data.content_type === '娱乐' || /(影视|电视剧|电影|游戏|音乐|综艺|动漫|明星|娱乐|内娱|韩娱|文娱|歌手|演员|艺人|爱豆|偶像)/.test(haystack);
  if (isEntertainment) {
    // Check television first: a drama title such as 《权力的游戏》 contains
    // the word “游戏” but is still unmistakably a TV recommendation.
    if (/(电视剧|美剧|英剧|韩剧|日剧|国产剧|剧集|单元剧|连续剧|追剧)/i.test(haystack)) {
      return ['生活', '休闲娱乐', '电视剧'];
    }
    if (/(游戏|电竞|Valorant|无畏契约|崩坏|星穹铁道|原神|王者荣耀|英雄联盟|Steam|练枪|配队|冲分)/i.test(haystack)) {
      return ['生活', '休闲娱乐', '游戏'];
    }
    if (/(电影|影片|院线)/i.test(haystack)) return ['生活', '休闲娱乐', '电影'];
    if (/(明星|歌手|艺人|爱豆|偶像|内娱|韩娱|文娱人物|人物向|明星造型|明星发型)/i.test(haystack)) {
      return ['生活', '休闲娱乐', '明星'];
    }
    if (/(音乐|歌曲|乐评|专辑|演唱会)/i.test(haystack)) return ['生活', '休闲娱乐', '音乐'];
    if (/(综艺|真人秀)/i.test(haystack)) return ['生活', '休闲娱乐', '综艺'];
    if (/(动漫|动画|漫画|二次元)/i.test(haystack)) return ['生活', '休闲娱乐', '动漫'];
    if (/(日常|随拍|口述)/i.test(haystack)) return ['生活', '休闲娱乐', '日常娱乐'];
    if (/(演出|舞台|晚会|戏曲|越剧|舞蹈|幕后花絮|彩排)/i.test(haystack)) return ['生活', '休闲娱乐', '演出'];
    return ['生活', '休闲娱乐', '其他娱乐'];
  }

  if (data.content_type === 'AI工具' || data.content_type === 'AI 工具') {
    const secondary = text(data.category_secondary);
    return ['工作', 'AI工具', secondary.includes('写作') ? 'AI写作' : (secondary || '效率工具')];
  }
  if (data.content_type === '理财') return ['工作', '理财与资产', text(data.category_secondary) || '理财知识'];
  if (data.content_type === '学习') return ['学习', '学习方法', text(data.category_secondary) || '知识整理'];
  if (data.content_type === '观点鸡汤') return ['学习', '认知思维', '创业观点'];
  return [text(data.category_primary) || '其他', text(data.category_secondary) || text(data.content_type) || '未分类', '综合'];
}
