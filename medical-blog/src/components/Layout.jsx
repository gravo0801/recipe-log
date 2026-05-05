import { NavLink } from 'react-router-dom';
import { Stethoscope, Sparkles, BookOpen, BookMarked, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Sparkles, label: '글 생성' },
  { to: '/library', icon: BookOpen, label: '주제 라이브러리' },
  { to: '/saved', icon: BookMarked, label: '저장된 글' },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 rounded-lg p-1.5">
              <Stethoscope size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-sm">의료 블로그 작성기</span>
          </div>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `ml-1 p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`
              }
              title="설정"
            >
              <Settings size={17} />
            </NavLink>
          </nav>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white py-4 mt-8">
        <p className="text-center text-xs text-gray-400">
          의료 블로그 작성기 · Powered by Google Gemini (무료) ·{' '}
          <span className="text-gray-300">개인 전용 도구</span>
        </p>
      </footer>
    </div>
  );
}
