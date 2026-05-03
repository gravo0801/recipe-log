import { useState, useEffect } from 'react';
import { Save, Check, Key, Hospital, User, ExternalLink, Eye, EyeOff } from 'lucide-react';

const DEFAULT = {
  geminiApiKey: '',
  clinicName: '',
  doctorName: '',
  defaultAudience: '',
};

export default function Settings() {
  const [form, setForm] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('blogSettings') || '{}');
    setForm({ ...DEFAULT, ...stored });
  }, []);

  const handleSave = () => {
    localStorage.setItem('blogSettings', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-teal-700 mb-1">⚙️ 설정</h1>
      <p className="text-gray-500 text-sm mb-8">API 키와 의원 정보를 입력합니다. 개원 전에는 의원 정보를 공란으로 두면 됩니다.</p>

      {/* API 설정 */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
          <Key size={18} className="text-teal-500" /> Gemini API 키 (무료)
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Google AI Studio에서 무료 발급 가능합니다.{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-teal-500 underline inline-flex items-center gap-0.5 hover:text-teal-700"
          >
            발급 받기 <ExternalLink size={12} />
          </a>
          {' '}(gemini-2.0-flash 모델 · 하루 1,500회 무료)
        </p>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={form.geminiApiKey}
            onChange={set('geminiApiKey')}
            placeholder="AIza..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          ⚠️ API 키는 이 기기의 로컬 저장소에만 보관됩니다. 외부로 전송되지 않습니다.
        </p>
      </section>

      {/* 의원 정보 */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
          <Hospital size={18} className="text-teal-500" /> 의원 정보
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          개원 전에는 비워두면 됩니다. 글 하단 PR 문구에 자동으로 삽입됩니다.
          <br />
          비워두면 <code className="bg-gray-100 px-1 rounded">[의원명]</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">[원장명]</code> 으로 표시됩니다.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <Hospital size={14} className="inline mr-1" /> 의원명
            </label>
            <input
              type="text"
              value={form.clinicName}
              onChange={set('clinicName')}
              placeholder="예: 행복내과의원  (개원 후 입력)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <User size={14} className="inline mr-1" /> 원장 이름
            </label>
            <input
              type="text"
              value={form.doctorName}
              onChange={set('doctorName')}
              placeholder="예: 홍길동 원장  (개원 후 입력)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
        </div>
      </section>

      {/* 기본 설정 */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-700 mb-1">✏️ 기본 타깃 독자 (선택)</h2>
        <p className="text-xs text-gray-400 mb-3">글 생성 시 기본으로 사용됩니다. 글마다 변경 가능합니다.</p>
        <input
          type="text"
          value={form.defaultAudience}
          onChange={set('defaultAudience')}
          placeholder="예: 40~60대 성인 남녀"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </section>

      <button
        onClick={handleSave}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
      >
        {saved ? (
          <><Check size={20} /> 저장 완료!</>
        ) : (
          <><Save size={20} /> 설정 저장</>
        )}
      </button>
    </div>
  );
}
