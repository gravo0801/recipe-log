import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked, Trash2, Copy, Check, ChevronDown, ChevronUp,
  Tag, Clock, Search, X, FileText, Sparkles, AlertCircle,
} from 'lucide-react';
import { buildCopyText } from '../utils/contentParser';

const CATEGORY_COLORS = {
  내과: 'bg-blue-100 text-blue-700',
  소아과: 'bg-yellow-100 text-yellow-700',
  외과: 'bg-red-100 text-red-700',
  정형외과: 'bg-orange-100 text-orange-700',
  피부과: 'bg-pink-100 text-pink-700',
  이비인후과: 'bg-purple-100 text-purple-700',
  안과: 'bg-indigo-100 text-indigo-700',
  가정의학과: 'bg-teal-100 text-teal-700',
  기타: 'bg-gray-100 text-gray-600',
};

// **볼드** 마크다운 처리 (BlogGenerator와 동일)
function BlogText({ text }) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  return (
    <div>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (/^\*\*.+\*\*$/.test(trimmed)) {
          const heading = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
          return (
            <h3 key={i} className="text-base font-bold text-teal-700 mt-6 mb-2 pb-1.5 border-b border-teal-100">
              {heading}
            </h3>
          );
        }
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-3 whitespace-pre-line text-sm">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{part}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// 이미지 위치 표시 (축약형)
function ImagePlaceholder({ section, num }) {
  return (
    <div className="my-4 rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3">
      <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
        <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">
          {num}
        </span>
        📷 이미지 #{num} — {section.descKo}
      </div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SavedPosts() {
  const [posts, setPosts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [savedSettings, setSavedSettings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setPosts(JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    setSavedSettings(JSON.parse(localStorage.getItem('blogSettings') || '{}'));
  }, []);

  const filtered = posts.filter((p) =>
    p.topic.includes(search) ||
    p.generated?.title?.includes(search) ||
    p.category.includes(search)
  );

  const handleDelete = (id) => {
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    localStorage.setItem('savedPosts', JSON.stringify(updated));
    if (expandedId === id) setExpandedId(null);
    setDeleteConfirmId(null);
  };

  const handleCopy = async (post) => {
    await navigator.clipboard.writeText(buildCopyText(post.generated, savedSettings));
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 이미지 번호 계산
  const getImageNums = (sections) => {
    const nums = {};
    let cnt = 0;
    sections?.forEach((sec, i) => { if (sec.type === 'image') nums[i] = ++cnt; });
    return nums;
  };

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <BookMarked size={56} className="text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">아직 저장된 글이 없습니다.</p>
        <p className="text-gray-400 text-sm mt-1">글을 생성하면 자동으로 여기에 저장됩니다.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          글 생성하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">💾 저장된 글</h1>
          <p className="text-gray-400 text-sm mt-0.5">생성한 블로그 글 전체 보기 · 최대 30개 보관</p>
        </div>
        <span className="text-sm text-gray-400">{posts.length}개</span>
      </div>

      {/* 검색 */}
      <div className="relative mb-5 mt-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="주제, 제목, 분야로 검색..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={15} />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          검색 결과가 없습니다.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((post) => {
          const isExpanded = expandedId === post.id;
          const imageNums = getImageNums(post.generated?.contentSections);

          return (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-teal-200 transition-colors"
            >
              {/* 카드 헤더 */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* 배지 + 날짜 */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS['기타']}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {formatDate(post.createdAt)}
                      </span>
                    </div>

                    {/* 주제 */}
                    <p className="font-semibold text-gray-800">{post.topic}</p>

                    {/* SEO 제목 */}
                    {post.generated?.title && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-start gap-1">
                        <Tag size={11} className="mt-0.5 shrink-0" />
                        <span>{post.generated.title}</span>
                      </p>
                    )}

                    {/* 키워드 미리보기 */}
                    {post.generated?.keywords?.length > 0 && !isExpanded && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.generated.keywords.slice(0, 4).map((kw, i) => (
                          <span key={i} className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {kw}
                          </span>
                        ))}
                        {post.generated.keywords.length > 4 && (
                          <span className="text-xs text-gray-400">+{post.generated.keywords.length - 4}개</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(post)}
                      className="flex items-center gap-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {copiedId === post.id ? <><Check size={12} />복사됨</> : <><Copy size={12} />복사</>}
                    </button>

                    {deleteConfirmId === post.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(post.id)}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 펼치기 버튼 */}
                <button
                  onClick={() => toggleExpand(post.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-teal-600 hover:bg-teal-50 py-1.5 rounded-lg transition-colors border border-gray-100"
                >
                  <FileText size={13} />
                  {isExpanded ? (
                    <><ChevronUp size={13} /> 글 접기</>
                  ) : (
                    <><ChevronDown size={13} /> 글 전체 보기</>
                  )}
                </button>
              </div>

              {/* 확장 뷰 — 전체 본문 */}
              {isExpanded && post.generated && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {/* SEO 정보 */}
                  <div className="mx-4 mt-4 bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                    <p className="text-xs font-semibold text-emerald-600 mb-1">SEO 제목</p>
                    <p className="font-semibold text-gray-800 text-sm mb-2">{post.generated.title}</p>
                    <p className="text-xs font-semibold text-emerald-600 mb-1">메타 설명</p>
                    <p className="text-gray-600 text-xs mb-2">{post.generated.meta}</p>
                    <p className="text-xs font-semibold text-emerald-600 mb-1.5">키워드</p>
                    <div className="flex flex-wrap gap-1">
                      {post.generated.keywords.map((kw, i) => (
                        <span key={i} className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 본문 */}
                  <div className="px-5 py-4">
                    {post.generated.contentSections.map((sec, i) =>
                      sec.type === 'text' ? (
                        <BlogText key={i} text={sec.content} />
                      ) : (
                        <ImagePlaceholder key={i} section={sec} num={imageNums[i]} />
                      )
                    )}

                    {/* 면책 고지 */}
                    {post.generated.disclaimer && (
                      <div className="mt-4 bg-gray-100 rounded-xl p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 mb-1">⚠️ 면책 고지</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{post.generated.disclaimer}</p>
                      </div>
                    )}

                    {/* 해시태그 */}
                    {post.generated.hashtags?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 mb-2">🏷️ 해시태그</p>
                        <div className="flex flex-wrap gap-1.5">
                          {post.generated.hashtags.map((tag, i) => (
                            <span key={i} className="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 복사 버튼 */}
                    <button
                      onClick={() => handleCopy(post)}
                      className="mt-5 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {copiedId === post.id ? (
                        <><Check size={16} />복사됨!</>
                      ) : (
                        <><Copy size={16} />전체 복사 — 네이버 블로그에 붙여넣기</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 저장 한도 안내 */}
      <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3 border border-gray-100">
        <AlertCircle size={13} className="shrink-0 mt-0.5" />
        <span>글은 이 기기의 로컬 저장소에 최대 30개까지 보관됩니다. 30개를 초과하면 오래된 글부터 자동 삭제됩니다.</span>
      </div>
    </div>
  );
}
