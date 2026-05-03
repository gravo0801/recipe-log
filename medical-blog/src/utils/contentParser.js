/**
 * Gemini가 생성한 텍스트를 파싱하여 구조화된 객체로 변환합니다.
 * 형식이 완벽하지 않아도 최대한 내용을 추출합니다.
 */
export function parseBlogContent(raw) {
  const text = raw.replace(/\r\n/g, '\n');

  const grab = (key) => {
    const re = new RegExp(`===${key}===\\s*([\\s\\S]*?)(?====[A-Z]+=|$)`);
    return (text.match(re)?.[1] ?? '').trim();
  };

  const result = {
    title: grab('TITLE'),
    meta: grab('META'),
    keywords: grab('KEYWORDS')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
    contentSections: [],
    disclaimer: grab('DISCLAIMER') ||
      '본 내용은 일반적인 의학 정보 제공을 목적으로 하며, 개인의 건강 상태에 따라 다를 수 있습니다. 정확한 진단과 치료를 위해서는 반드시 전문 의사와 상담하시기 바랍니다.',
  };

  const contentRaw = grab('CONTENT');
  if (contentRaw) {
    const parts = contentRaw.split(/(~~~IMAGE~~~[\s\S]*?~~~END~~~)/g);
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('~~~IMAGE~~~')) {
        const g = (key) => (trimmed.match(new RegExp(`${key}:\\s*(.+)`)) || [])[1]?.trim() || '';
        const promptMatch = trimmed.match(/AI_PROMPT:\s*([\s\S]*?)(?=~~~END~~~)/);
        result.contentSections.push({
          type: 'image',
          position: g('POSITION'),
          imageType: g('TYPE'),
          descKo: g('DESC_KO'),
          aiPrompt: promptMatch?.[1]?.trim() || '',
        });
      } else {
        result.contentSections.push({ type: 'text', content: trimmed });
      }
    });
  }

  return result;
}

/** 네이버 블로그 붙여넣기용 전체 텍스트 생성 */
export function buildCopyText(parsed) {
  let out = '';
  let imgNum = 1;

  out += `📌 [SEO 제목]\n${parsed.title}\n\n`;
  out += `📝 [메타 설명]\n${parsed.meta}\n\n`;
  out += `🔑 [키워드]\n${parsed.keywords.join(', ')}\n\n`;
  out += `${'─'.repeat(50)}\n\n`;

  parsed.contentSections.forEach((sec) => {
    if (sec.type === 'text') {
      out += sec.content + '\n\n';
    } else {
      out += `\n${'═'.repeat(48)}\n`;
      out += `📷 [이미지 삽입 위치 #${imgNum}]\n`;
      out += `• 타입: ${sec.imageType}\n`;
      out += `• 위치: ${sec.position}\n`;
      out += `• 설명: ${sec.descKo}\n\n`;
      out += `🤖 AI 이미지 생성 프롬프트 (Grok / Gemini / DALL-E 등):\n`;
      out += `"${sec.aiPrompt}"\n`;
      out += `${'═'.repeat(48)}\n\n`;
      imgNum++;
    }
  });

  out += `${'─'.repeat(50)}\n`;
  out += `⚠️ [면책 고지]\n${parsed.disclaimer}`;
  return out;
}
