import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Clock, Calendar, ChefHat } from 'lucide-react';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore에서 레시피 실시간 구독
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipeData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching recipes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">레시피 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            아직 레시피가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            첫 번째 레시피를 추가해보세요!
          </p>
          <Link to="/recipe/new" className="btn-primary inline-flex items-center">
            레시피 추가하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        나의 레시피 ({recipes.length})
      </h1>

      {/* 반응형 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
      {/* 썸네일 이미지 */}
      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
        {recipe.thumbnailUrl ? (
          <img 
            src={recipe.thumbnailUrl} 
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-primary-300" />
          </div>
        )}
      </div>

      {/* 카드 내용 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
          {recipe.title}
        </h3>

        {/* 태그 */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>
              {recipe.createdAt?.toDate ? 
                recipe.createdAt.toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                : '날짜 없음'
              }
            </span>
          </div>

          {recipe.lastCookedAt && (
            <div className="flex items-center space-x-1 text-primary-600">
              <Clock className="w-4 h-4" />
              <span className="text-xs">
                최근 조리
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
