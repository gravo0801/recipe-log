import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Layout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Slim editorial header — masthead lives in Home.jsx itself */}
      <header className="bg-paper sticky top-0 z-50 border-b border-rule">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-serif italic text-lg tracking-tight hover:text-accent transition-colors">
              나의 레시피
            </Link>
            <button
              onClick={() => navigate('/recipe/new')}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">새 레시피</span>
              <span className="sm:hidden">기록</span>
            </button>
          </div>
        </div>
      </header>

      {/* Constrained reading column — magazine-style */}
      <main className="max-w-3xl mx-auto px-5 sm:px-6 pt-6 pb-12">
        {children}
      </main>
    </div>
  );
}
