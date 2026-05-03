const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 15000;

// Sequential request queue — one Gemini call at a time
let queue = Promise.resolve();

function enqueue(fn) {
  const result = queue.then(fn);
  queue = result.catch(() => {});
  return result;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(apiKey, prompt, { maxTokens = 8192, temperature = 0.75, allowContinuation = true } = {}) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || '';
    const error = new Error(msg || `오류가 발생했습니다 (${res.status})`);
    error.status = res.status;
    if (res.status === 400) error.message = 'API 키가 올바르지 않습니다. 설정 페이지를 확인해주세요.';
    if (res.status === 429) error.message = '요청 한도를 초과했습니다.';
    throw error;
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error('생성된 내용이 없습니다. 다시 시도해주세요.');

  // 글이 잘린 경우 1회 이어쓰기
  if (allowContinuation && candidate?.finishReason === 'MAX_TOKENS') {
    const tail = text.slice(-800);
    const continued = await callGemini(
      apiKey,
      `아래 의료 블로그 글이 길이 제한으로 잘렸습니다. 잘린 부분부터 이어서 완성하고 ===DISCLAIMER===와 ===HASHTAGS=== 섹션으로 마무리해주세요.\n\n...${tail}`,
      { maxTokens, temperature, allowContinuation: false },
    );
    return text + continued;
  }

  return text;
}

/**
 * @param {string} apiKey
 * @param {string} prompt
 * @param {(attempt: number, total: number) => void} [onRetry]
 */
export async function generateBlogPost(apiKey, prompt, onRetry) {
  return enqueue(async () => {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        return await callGemini(apiKey, prompt);
      } catch (err) {
        const isRateLimit = err.status === 429;
        const hasRetriesLeft = attempt <= MAX_RETRIES;

        if (isRateLimit && hasRetriesLeft) {
          onRetry?.(attempt, MAX_RETRIES);
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        if (isRateLimit) throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        throw err;
      }
    }
  });
}

/**
 * @param {string} apiKey
 * @param {{ topic: string, category: string, emphasis: string }} param1
 * @returns {Promise<Array<{ type: string, title: string }> | null>}
 */
export async function generateSeoTitles(apiKey, { topic, category, emphasis }) {
  return enqueue(() =>
    callGemini(
      apiKey,
      `네이버 블로그 SEO에 최적화된 의료 블로그 제목 5개를 아래 형식으로 정확히 생성해주세요. 각 제목은 30자 이내입니다.

주제: ${topic} / 분야: ${category} / 강조: ${emphasis}

검색유입형: [제목]
공감형: [제목]
정보형: [제목]
질문형: [제목]
숫자형: [제목]`,
      { maxTokens: 512, temperature: 0.85, allowContinuation: false },
    ).then((text) => {
      const TYPES = [
        { key: '검색유입형', label: '검색 유입형' },
        { key: '공감형', label: '공감형' },
        { key: '정보형', label: '정보형' },
        { key: '질문형', label: '질문형' },
        { key: '숫자형', label: '숫자형' },
      ];
      return TYPES.map(({ key, label }) => {
        const match = text.match(new RegExp(`${key}:\\s*\\[?([^\\]\\n]+)\\]?`));
        return { type: label, title: match?.[1]?.trim() || '' };
      }).filter((t) => t.title);
    }).catch(() => null),
  );
}
