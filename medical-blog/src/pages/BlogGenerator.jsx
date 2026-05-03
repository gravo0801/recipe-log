import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, Copy, Check, ChevronDown, ChevronUp,
  FileText, Tag, Loader2, AlertCircle, Settings,
} from 'lucide-react';
import { generateBlogPost, generateSeoTitles } from '../utils/geminiApi';
import { buildPrompt } from '../utils/blogPrompt';
import { parseBlogContent, buildCopyText } from '../utils/contentParser';

const CATEGORIES = ['내과', '소아과', '외과', '정형외과', '피부과', '이비인후과', '안과', '가정의학과', '기타'];
const EMPHASES = ['복합 (전반적 설명)', '증상 및 원인', '진단 방법', '치료 옵션', '예방 및 생활습관', '약물 치료'];

const QUICK_TOPICS = [
  { topic: '고혈압', category: '내과', emphasis: '복합 (전반적 설명)', targetAudience: '40~60대 성인' },
  { topic: '당뇨병 관리', category: '내과', emphasis: '예방 및 생활습관', targetAudience: '40~70대 성인' },
  { topic: '고지혈증(이상지질혈증)', category: '내과', emphasis: '치료 옵션', targetAudience: '40~60대 성인' },
  { topic: '역류성 식도염', category: '내과', emphasis: '증상 및 원인', targetAudience: '20~50대 직장인' },
  { topic: '갑상선 기능 저하증', category: '내과', emphasis: '증상 및 원인', targetAudience: '30~60대 여성' },
  { topic: '빈혈', category: '내과', emphasis: '복합 (전반적 설명)', targetAudience: '20~50대 여성' },
  { topic: '과민성 대장 증후군', category: '내과', emphasis: '예방 및 생활습관', targetAudience: '20~40대 성인' },
  { topic: '만성 피로', category: '내과', emphasis: '증상 및 원인', targetAudience: '30~50대 직장인' },
  { topic: '감기 vs 독감 차이점', category: '내과', emphasis: '진단 방법', targetAudience: '전 연령' },
  { topic: '요로감염(방광염)', category: '내과', emphasis: '복합 (전반적 설명)', targetAudience: '20~60대 여성' },
  { topic: '통풍', category: '내과', emphasis: '증상 및 원인', targetAudience: '40~60대 남성' },
  { topic: '수면 장애·불면증', category: '내과', emphasis: '예방 및 생활습관', targetAudience: '30~60대 성인' },
];

// **볼드** 마크다운 처리 + 단락 렌더링 (UI 미리보기용)
function BlogText({ text }) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return (
    <div>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (/^\*\*.+\*\*$/.test(trimmed)) {
          const heading = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
          return (
            <h3 key={i} className="text-base font-bold text-teal-700 mt-8 mb-3 pb-2 border-b border-teal-100">
              {heading}
            </h3>
          );
        }
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-semibold text-gray-900">{part}</strong>
              ) : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// 이미지 삽입 위치 카드
function ImageCard({ section, num, onCopy, copied }) {
  return (
    <div className="my-6 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
          {num}
        </span>
        <span className="font-semibold text-blue-700 text-sm">📷 이미지 삽입 위치 #{num}</span>
        <span className="ml-auto text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
          {section.imageType || '이미지'}
        </span>
      </div>
      <div className="space-y-1.5 text-sm mb-3">
        <div className="flex gap-2">
          <span className="text-blue-600 font-medium min-w-[36px]">위치</span>
          <span className="text-gray-600">{section.position}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-blue-600 font-medium min-w-[36px]">설명</span>
          <span className="text-gray-600">{section.descKo}</span>
        </div>
      </div>
      <div className="bg-white rounded-lg p-3 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            🤖 AI 이미지 생성 프롬프트
          </span>
          <button
            onClick={() => onCopy(num, section.aiPrompt)}
            className="flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-md transition-colors"
          >
            {copied ? <><Check size={12} />복사됨</> : <><Copy size={12} />복사</>}
          </button>
        </div>
        <p className="text-gray-500 text-xs font-mono leading-relaxed break-all">"{section.aiPrompt}"</p>
        <p className="text-gray-400 text-xs mt-2">
          ↑ 이 프롬프트를 Grok / Gemini ImageFX / DALL-E / Midjourney 등에 붙여넣기 하세요.
        </p>
      </div>
    </div>
  );
}

// SEO 제목 추천 카드
function SeoTitlesCard({ titles, loading, copiedIdx, onCopy }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin text-teal-400" />
          <span className="text-sm font-medium">SEO 제목 5가지 생성 중...</span>
        </div>
      </div>
    );
  }
  if (!titles?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Sparkles size={17} className="text-teal-500" /> 네이버 블로그 SEO 제목 추천 5가지
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">마음에 드는 제목을 골라 복사하세요</p>
      </div>
      <div className="divide-y divide-gray-50">
        {titles.map((t, i) => (
          <div key={i} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="shrink-0 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium mt-0.5">
                {t.type}
              </span>
              <span className="text-sm text-gray-800 leading-snug">{t.title}</span>
            </div>
            <button
              onClick={() => onCopy(i, t.title)}
              className="shrink-0 flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md transition-colors"
            >
              {copiedIdx === i ? <><Check size={12} />복사됨</> : <><Copy size={12} />복사</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// CTA 섹션 카드
function CtaCard({ clinicName, doctorName }) {
  const clinic = clinicName?.trim() || '[의원명]';
  const doctor = doctorName?.trim() || '[원장명]';
  const hasInfo = clinicName?.trim() && doctorName?.trim();
  return (
    <div className="mt-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-700 font-bold text-sm">🏥 {clinic} 진료 안내</span>
        {!hasInfo && (
          <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
            설정 페이지에서 수정
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-sm">
        <p className="text-gray-700">👨‍⚕️ <strong>담당의</strong>: {doctor}</p>
        <p>
          🕐 <strong className="text-gray-700">진료시간</strong>:{' '}
          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">직접 입력 필요</span>
        </p>
        <p>
          🍽️ <strong className="text-gray-700">점심시간</strong>:{' '}
          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">직접 입력 필요</span>
        </p>
        <p>
          📍 <strong className="text-gray-700">위치</strong>:{' '}
          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">주소 입력 필요</span>
        </p>
        <p>
          📞 <strong className="text-gray-700">예약</strong>:{' '}
          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">전화번호 또는 예약링크 입력 필요</span>
        </p>
      </div>
      <p className="text-xs text-amber-600 mt-3">
        ↑ 주황색 항목은 복사 후 직접 수정해주세요
      </p>
    </div>
  );
}

export default function BlogGenerator() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    topic: '',
    category: '내과',
    emphasis: '복합 (전반적 설명)',
    targetAudience: '',
  });
  const [loading, setLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState(null);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState({});
  const [seoTitles, setSeoTitles] = useState(null);
  const [titlesLoading, setTitlesLoading] = useState(false);
  const [copiedTitleIdx, setCopiedTitleIdx] = useState(null);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [savedSettings, setSavedSettings] = useState({});

  // 설정 로드
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('blogSettings') || '{}');
    setSavedSettings(settings);
    if (settings.defaultAudience && !form.targetAudience) {
      setForm((prev) => ({ ...prev, targetAudience: settings.defaultAudience }));
    }
  }, []);

  // 주제 라이브러리에서 "다시 생성" 클릭 시 폼 자동 채우기
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (prefill) {
      setForm({
        topic: prefill.topic || '',
        category: prefill.category || '내과',
        emphasis: prefill.emphasis || '복합 (전반적 설명)',
        targetAudience: prefill.targetAudience || '',
      });
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = async () => {
    const settings = JSON.parse(localStorage.getItem('blogSettings') || '{}');
    if (!form.topic.trim()) { setError('주제를 입력해주세요.'); return; }
    if (!settings.geminiApiKey) {
      setError('Gemini API 키가 없습니다. 우측 상단 ⚙️ 설정에서 먼저 API 키를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setGenerated(null);
    setSeoTitles(null);
    setTitlesLoading(false);
    setRetryStatus(null);

    try {
      const prompt = buildPrompt({
        ...form,
        clinicName: settings.clinicName,
        doctorName: settings.doctorName,
      });
      const rawText = await generateBlogPost(
        settings.geminiApiKey,
        prompt,
        (attempt, total) => setRetryStatus({ attempt, total }),
      );
      const parsed = parseBlogContent(rawText);
      setGenerated(parsed);
      setFormOpen(false);
      setLoading(false);
      setRetryStatus(null);

      // 주제 라이브러리 자동 저장 (최대 50개)
      const lib = JSON.parse(localStorage.getItem('topicLibrary') || '[]');
      const entry = { id: Date.now().toString(), ...form, seoTitle: parsed.title, createdAt: new Date().toISOString() };
      localStorage.setItem('topicLibrary', JSON.stringify([entry, ...lib].slice(0, 50)));

      // SEO 제목 5개 별도 생성 (비동기, 실패해도 무관)
      setTitlesLoading(true);
      generateSeoTitles(settings.geminiApiKey, form)
        .then((titles) => { if (titles?.length) setSeoTitles(titles); })
        .catch(() => {})
        .finally(() => setTitlesLoading(false));

    } catch (err) {
      setError(err.message);
      setLoading(false);
      setRetryStatus(null);
    }
  };

  const handleCopyAll = async () => {
    const settings = JSON.parse(localStorage.getItem('blogSettings') || '{}');
    await navigator.clipboard.writeText(buildCopyText(generated, settings));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopyPrompt = async (num, prompt) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompts((prev) => ({ ...prev, [num]: true }));
    setTimeout(() => setCopiedPrompts((prev) => ({ ...prev, [num]: false })), 2500);
  };

  const handleCopyTitle = async (idx, title) => {
    await navigator.clipboard.writeText(title);
    setCopiedTitleIdx(idx);
    setTimeout(() => setCopiedTitleIdx(null), 2500);
  };

  const handleCopyHashtags = async () => {
    await navigator.clipboard.writeText(generated.hashtags.join(' '));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2500);
  };

  // 섹션별 이미지 번호 계산
  const imageNums = {};
  let imgCounter = 0;
  (generated?.contentSections ?? []).forEach((sec, i) => {
    if (sec.type === 'image') imageNums[i] = ++imgCounter;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-teal-700 mb-2">✍️ 의료 블로그 글 생성기</h1>
        <p className="text-gray-500 text-sm">
          주제를 설정하면 환자 눈높이의 네이버 블로그 글 + 이미지 프롬프트를 자동 생성합니다
        </p>
      </div>

      {/* 폼 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="font-semibold text-gray-700">
            📝 주제 설정
            {!formOpen && form.topic && (
              <span className="ml-2 text-sm font-normal text-teal-600">— {form.topic}</span>
            )}
          </span>
          {formOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {formOpen && (
          <div className="px-5 pb-5 border-t border-gray-50 space-y-4 pt-4">
            {/* [6] 의원/원장 설정 상태 표시 */}
            <div className="flex items-center gap-1.5 text-xs">
              {savedSettings.clinicName ? (
                <span className="text-teal-600">
                  ✓ <strong>{savedSettings.clinicName}</strong> · {savedSettings.doctorName || '원장명 미설정'} — 글에 자동 반영됩니다
                </span>
              ) : (
                <span className="text-gray-400">
                  ⚙️{' '}
                  <button onClick={() => navigate('/settings')} className="underline hover:text-gray-600">
                    설정
                  </button>
                  에서 의원명/원장명 입력 시 글에 자동 반영됩니다
                </span>
              )}
            </div>

            {/* 빠른 주제 선택 */}
            <div>
              <p className="text-xs text-gray-400 mb-2">⚡ 빠른 주제 선택 (내과 중심)</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPICS.map((qt, i) => (
                  <button
                    key={i}
                    onClick={() => setForm((prev) => ({ ...prev, ...qt }))}
                    className={`text-xs border px-3 py-1.5 rounded-full transition-colors ${
                      form.topic === qt.topic
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                    }`}
                  >
                    {qt.topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  주제 / 증상 / 질환명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={set('topic')}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="예: 고혈압, 당뇨병, 역류성 식도염, 빈혈..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">진료 분야</label>
                <select
                  value={form.category}
                  onChange={set('category')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">강조 포인트</label>
                <select
                  value={form.emphasis}
                  onChange={set('emphasis')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {EMPHASES.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  타깃 독자 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  value={form.targetAudience}
                  onChange={set('targetAudience')}
                  placeholder="예: 40~50대 직장인 남성, 임신 중인 30대 여성, 고령 어르신..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> 블로그 글 생성 중...</>
              ) : (
                <><Sparkles size={20} /> 블로그 글 생성하기</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 size={52} className="animate-spin text-teal-400 mx-auto mb-4" />
          {retryStatus ? (
            <>
              <p className="text-amber-600 font-medium">
                잠시 후 재시도 중... ({retryStatus.attempt}/{retryStatus.total})
              </p>
              <p className="text-gray-400 text-sm mt-1">요청 한도 초과 · 15초 후 자동 재시도합니다</p>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-medium">Gemini AI가 블로그 글을 작성하고 있습니다...</p>
              <p className="text-gray-400 text-sm mt-1">환자 친화적 내용 구성 중 · 보통 15~30초 소요</p>
            </>
          )}
        </div>
      )}

      {/* 결과 */}
      {generated && !loading && (
        <div className="space-y-4">
          {/* SEO 정보 카드 */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
            <h2 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
              <Tag size={17} /> SEO 정보 (네이버 블로그 최적화)
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-0.5">제목</p>
                <p className="text-gray-800 font-semibold">{generated.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-0.5">메타 설명</p>
                <p className="text-gray-600 text-sm">{generated.meta}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-1">키워드</p>
                <div className="flex flex-wrap gap-1.5">
                  {generated.keywords.map((kw, i) => (
                    <span key={i} className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* [3] SEO 제목 추천 5가지 */}
          <SeoTitlesCard
            titles={seoTitles}
            loading={titlesLoading}
            copiedIdx={copiedTitleIdx}
            onCopy={handleCopyTitle}
          />

          {/* 본문 카드 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={17} /> 블로그 본문 미리보기
              </h2>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {copiedAll ? <><Check size={15} />복사됨!</> : <><Copy size={15} />전체 복사</>}
              </button>
            </div>

            <div className="px-6 py-5">
              {generated.contentSections.map((sec, i) =>
                sec.type === 'text' ? (
                  <BlogText key={i} text={sec.content} />
                ) : (
                  <ImageCard
                    key={i}
                    section={sec}
                    num={imageNums[i]}
                    onCopy={handleCopyPrompt}
                    copied={copiedPrompts[imageNums[i]]}
                  />
                )
              )}

              {/* 면책 고지 */}
              {generated.disclaimer && (
                <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-400 mb-1">⚠️ 면책 고지</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{generated.disclaimer}</p>
                </div>
              )}

              {/* [5] CTA 섹션 */}
              <CtaCard
                clinicName={savedSettings.clinicName}
                doctorName={savedSettings.doctorName}
              />

              {/* [4] 해시태그 */}
              {generated.hashtags?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500">🏷️ 네이버 블로그 해시태그</p>
                    <button
                      onClick={handleCopyHashtags}
                      className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md transition-colors"
                    >
                      {copiedHashtags ? <><Check size={12} />복사됨</> : <><Copy size={12} />복사</>}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {generated.hashtags.map((tag, i) => (
                      <span key={i} className="text-sm bg-teal-50 text-teal-600 border border-teal-200 px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={handleCopyAll}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {copiedAll ? (
                  <><Check size={18} />전체 복사됨!</>
                ) : (
                  <><Copy size={18} />전체 복사 — 네이버 블로그에 붙여넣기</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                마크다운 제거 · CTA · 해시태그 포함 · 이미지 삽입 위치 안내 포함
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
