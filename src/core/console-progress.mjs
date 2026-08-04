export function makeProgressBar(done, total, width = 20) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeDone = Math.min(safeTotal, Math.max(0, Number(done) || 0));
  const ratio = safeTotal === 0 ? 1 : safeDone / safeTotal;
  const filled = Math.round(ratio * width);
  const percent = Math.round(ratio * 100);
  return `[${'█'.repeat(filled)}${'░'.repeat(Math.max(0, width - filled))}] ${safeDone}/${safeTotal} ${percent}%`;
}

export function shortTitle(title, max = 32) {
  const text = String(title || '未命名视频').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
