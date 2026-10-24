const FALLBACK_COLORS = ['#FFD978', '#BAE6FD', '#A8D8B9', '#FFE2D8', '#E0F2FE', '#FFF9F2'];

export function parseIdeaBody(rawBody = '') {
  const body = typeof rawBody === 'string' ? rawBody : '';
  const categoryMatch = body.match(/KATEGORI:\s*([^\r\n]+)/i);
  const impactMatch = body.match(/TINGKAT DAMPAK:\s*(\d+)/i);
  const cardPattern = /【([^】]*)】\r?\n([\s\S]*?)(?=\r?\n{2,}【|$)/g;
  const cards = [];
  let match;

  while ((match = cardPattern.exec(body)) !== null) {
    const [title = '', type = '', color = ''] = match[1].split('|||');
    const index = cards.length;
    cards.push({
      id: index + 1,
      title: title.trim(),
      type: type.trim(),
      color: /^#[\da-f]{6}$/i.test(color.trim()) ? color.trim() : FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      desc: match[2].trim(),
    });
  }

  return {
    category: categoryMatch?.[1]?.trim() || '',
    impact: Math.max(0, Math.min(5, Number(impactMatch?.[1]) || 0)),
    cards,
  };
}

export function serializeIdeaBody({ tag, impactRating, cards }) {
  const heading = `🏷️ KATEGORI: ${tag}\n⭐ TINGKAT DAMPAK: ${impactRating}/5 Bintang\n\n`;
  const cardContent = cards
    .map((card) => `【${card.title}|||${card.type || ''}|||${card.color || ''}】\n${card.desc || ''}`)
    .join('\n\n');
  return `${heading}${cardContent}`;
}
