const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

export async function generateBlogPost(apiKey, prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || '';
    if (res.status === 400) throw new Error('API 키가 올바르지 않습니다. 설정 페이지를 확인해주세요.');
    if (res.status === 429) throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    throw new Error(msg || `오류가 발생했습니다 (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('생성된 내용이 없습니다. 다시 시도해주세요.');
  return text;
}
