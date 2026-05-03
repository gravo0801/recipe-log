import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, Sparkles, Clock, Tag, ChevronRight } from 'lucide-react';

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

export default function TopicLibrary() {
  const [topics, setTopics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setTopics(JSON.parse(localStorage.getItem('topicLibrary') || '[]'));
  }, []);

  const handleDelete = (id) => {
    const updated = topics.filter((t) => t.id !== id);
    setTopics(updated);
    localStorage.setItem('topicLibrary', JSON.stringify(updated));
  };

  const handleRegenerate = (topic) => {
    navigate('/', { state: { prefill: topic } });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  if (topics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <BookOpen size={56} className="text-gray-200 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">아직 저장된 주제가 없습니다.</p>
        <p className="text-gray-400 text-sm mt-1">블로그 글을 생성하면 주제가 자동으로 저장됩니다.</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">📚 주제 라이브러리</h1>
          <p className="text-gray-400 text-sm mt-0.5">생성한 글의 주제 목록 · 클릭으로 다시 생성</p>
        </div>
        <span className="text-sm text-gray-400">{topics.length}개</span>
      </div>

      <div className="space-y-3">
        {topics.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 hover:border-teal-200 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    CATEGORY_COLORS[t.category] || CATEGORY_COLORS['기타']
                  }`}
                >
                  {t.category}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={11} /> {formatDate(t.createdAt)}
                </span>
              </div>

              <p className="font-semibold text-gray-800 truncate">{t.topic}</p>

              {t.seoTitle && (
                <p className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1">
                  <Tag size={11} /> {t.seoTitle}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-gray-400">{t.emphasis}</span>
                {t.targetAudience && (
                  <span className="text-xs text-gray-400">· {t.targetAudience}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleRegenerate(t)}
                className="flex items-center gap-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles size={13} /> 다시 생성
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
