import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles, Copy, Check, ChevronDown, ChevronUp,
  FileText, Tag, Loader2, AlertCircle, Image as ImageIcon,
} from 'lucide-react';
import { generateBlogPost } from '../utils/geminiApi';
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

// **볼드** 마크다운 처리 + 단락 렌더링
function BlogText({ text }) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return (
    <div>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        // 줄 전체가 **...**이면 소제목
        if (/^\*\*.+\*\*$/.test(trimmed)) {
          const heading = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
          return (
            <h3
              key={i}
              className="text-base font-bold text-teal-700 mt-8 mb-3 pb-2 border-b border-teal-100"
            >
              {heading}
            </h3>
          );
        }
        // 인라인 볼드 처리
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-semibold text-gray-900">
                  {part}
                </strong>
              ) : (
                part
              )
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
        <p className="text-gray-500 text-xs font-mono leading-relaxed break-all">
          "{section.aiPrompt}"
        </p>
        <p className="text-gray-400 text-xs mt-2">
          ↑ 이 프롬프트를 Grok / Gemini ImageFX / DALL-E / Midjourney 등에 붙여넣기 하세요.
        </p>
      </div>
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
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedPrompts, setCopiedPrompts] = useState({});

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

  // 저장된 기본 독자 설정 불러오기
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('blogSettings') || '{}');
    if (settings.defaultAudience && !form.targetAudience) {
      setForm((prev) => ({ ...prev, targetAudience: settings.defaultAudience }));
    }
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = async () => {
    const settings = JSON.parse(localStorage.getItem('blogSettings') || '{}');
    if (!form.topic.trim()) {
      setError('주제를 입력해주세요.');
      return;
    }
    if (!settings.geminiApiKey) {
      setError('Gemini API 키가 없습니다. 우측 상단 ⚙️ 설정에서 먼저 API 키를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setGenerated(null);

    try {
      const prompt = buildPrompt({
        ...form,
        clinicName: settings.clinicName,
        doctorName: settings.doctorName,
      });
      const rawText = await generateBlogPost(settings.geminiApiKey, prompt);
      const parsed = parseBlogContent(rawText);
      setGenerated(parsed);
      setFormOpen(false);

      // 주제 라이브러리에 자동 저장 (최대 50개)
      const lib = JSON.parse(localStorage.getItem('topicLibrary') || '[]');
      const entry = { id: Date.now().toString(), ...form, seoTitle: parsed.title, createdAt: new Date().toISOString() };
      localStorage.setItem('topicLibrary', JSON.stringify([entry, ...lib].slice(0, 50)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(buildCopyText(generated));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopyPrompt = async (num, prompt) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompts((prev) => ({ ...prev, [num]: true }));
    setTimeout(() => setCopiedPrompts((prev) => ({ ...prev, [num]: false })), 2500);
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
              {/* 주제 입력 */}
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

              {/* 진료 분야 */}
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

              {/* 강조 포인트 */}
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

              {/* 타깃 독자 */}
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

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* 생성 버튼 */}
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
          <p className="text-gray-600 font-medium">Gemini AI가 블로그 글을 작성하고 있습니다...</p>
          <p className="text-gray-400 text-sm mt-1">환자 친화적 내용 구성 중 · 보통 15~30초 소요</p>
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
                    <span
                      key={i}
                      className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
                이미지 프롬프트 포함 · AI 이미지 생성 후 해당 위치에 삽입하세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
