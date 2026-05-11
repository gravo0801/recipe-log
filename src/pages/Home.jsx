// New Home.jsx — Classic Editorial layout
// Drop into src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChefHat, Search, Plus } from 'lucide-react';

const TAGS = ['전체', '한식', '양식', '중식', '일식', '동남아', '디저트'];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('전체');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = recipes.filter(r => {
    if (activeTag !== '전체' && !(r.tags || []).includes(activeTag)) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const month = new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const vol = String(Math.max(1, Math.floor(recipes.length / 3))).padStart(2, '0');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
          <p className="text-muted font-mono text-xs tracking-widest uppercase">레시피 불러오는 중</p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="font-mono text-xs tracking-widest text-muted uppercase mb-3">VOL. 01 · 시작</div>
          <h3 className="font-serif text-3xl text-ink leading-tight mb-3">
            첫 번째 <span className="italic">레시피</span>를<br />기록해보세요
          </h3>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            오늘 만든 한 끼가 내일의 레시피가 됩니다.
          </p>
          <Link to="/recipe/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> 레시피 추가하기
          </Link>
        </div>
      </div>
    );
  }

  const [hero, ...rest] = filtered;
  const collection_ = rest.slice(0, 6);
  const archive = rest.slice(6);

  return (
    <div className="pb-16">
      {/* Masthead */}
      <div className="border-b border-rule pb-4 mb-6">
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            VOL. {vol} · {month}
          </span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            {recipes.length}개의 기록
          </span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl leading-none tracking-tight mt-2">
          나의 <span className="italic">레시피</span>
        </h1>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border border-rule rounded-full px-4 py-2.5 text-sm text-muted mb-4">
        <Search className="w-4 h-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="재료, 제목, 메모 검색"
          className="bg-transparent flex-1 outline-none placeholder:text-muted text-ink"
        />
      </div>

      {/* Tags */}
      <div className="flex gap-5 overflow-x-auto pb-1 mb-7 -mx-1 px-1">
        {TAGS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            className={`text-xs tracking-wide whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
              activeTag === t
                ? 'text-ink font-bold border-accent'
                : 'text-muted font-medium border-transparent hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Cover story */}
      {hero && (
        <Link to={`/recipe/${hero.id}`} className="block group mb-10">
          <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase mb-2.5">
            · 이 달의 레시피 ·
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
            {hero.thumbnailUrl ? (
              <img
                src={hero.thumbnailUrl}
                alt={hero.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ChefHat className="w-20 h-20 text-rule" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
            {hero.tags?.[0] && (
              <div className="absolute top-3.5 left-3.5 font-mono text-[9px] tracking-[0.16em] text-white bg-black/55 backdrop-blur-md px-2 py-1 uppercase">
                {hero.tags[0]}
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="font-serif italic text-[11px] opacity-85">No. 01</div>
              <h2 className="font-serif text-2xl md:text-3xl leading-tight tracking-tight mt-0.5">
                {hero.title}
              </h2>
              {hero.source?.description && (
                <p className="text-xs opacity-90 mt-2 leading-snug line-clamp-2">
                  {hero.source.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-2.5 font-mono text-[10px] text-muted tracking-wide">
            <span>{(hero.tags || [])[0] || '레시피'}</span>
            <span>·</span>
            <span>
              {hero.createdAt?.toDate
                ? hero.createdAt.toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                : ''}
            </span>
          </div>
        </Link>
      )}

      {/* Collection — magazine TOC */}
      {collection_.length > 0 && (
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-serif text-2xl tracking-tight">나의 컬렉션</h3>
            <span className="font-mono text-[10px] tracking-widest text-muted">
              {collection_.length}개
            </span>
          </div>
          <div>
            {collection_.map((r, i) => (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="flex gap-3.5 py-3.5 border-t border-rule group"
              >
                <div className="w-22 h-22 flex-none rounded-sm overflow-hidden bg-paper-deep" style={{ width: 88, height: 88 }}>
                  {r.thumbnailUrl ? (
                    <img
                      src={r.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-rule" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="font-mono text-[9px] tracking-widest text-muted uppercase">
                      No. {String(i + 2).padStart(2, '0')}
                      {r.tags?.[0] && ` · ${r.tags[0]}`}
                    </div>
                    <h4 className="font-serif text-lg leading-tight tracking-tight mt-1 line-clamp-1">
                      {r.title}
                    </h4>
                  </div>
                  <div className="flex gap-2.5 font-mono text-[10px] text-muted tracking-wide">
                    {r.tags?.slice(1, 2).map(t => <span key={t}>#{t}</span>)}
                    {r.createdAt?.toDate && (
                      <span>{r.createdAt.toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            <div className="border-t border-rule" />
          </div>
        </div>
      )}

      {/* Archive grid */}
      {archive.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-4 pt-4 border-t border-rule">
            <h3 className="font-serif text-xl tracking-tight">아카이브</h3>
            <span className="font-mono text-[10px] tracking-widest text-muted">↓ 최신순</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {archive.map((r, i) => (
              <Link key={r.id} to={`/recipe/${r.id}`} className="group">
                <div className="aspect-square overflow-hidden bg-paper-deep">
                  {r.thumbnailUrl ? (
                    <img
                      src={r.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-rule" />
                    </div>
                  )}
                </div>
                <div className="font-mono text-[9px] tracking-widest text-muted uppercase mt-2.5">
                  {String(i + collection_.length + 2).padStart(2, '0')}
                  {r.tags?.[0] && ` · ${r.tags[0]}`}
                </div>
                <h4 className="font-serif text-base leading-tight tracking-tight mt-1 line-clamp-2">
                  {r.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pull quote */}
      <div className="text-center mt-12">
        <p className="font-serif italic text-base text-ink-soft leading-relaxed max-w-xs mx-auto">
          "오늘 만든 한 끼는<br />내일의 레시피가 된다."
        </p>
      </div>
    </div>
  );
}
