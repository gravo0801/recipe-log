import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { ArrowLeft, Edit, Trash2, Calendar, Link as LinkIcon, ChefHat, Plus, Star, X, Upload } from 'lucide-react';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('recipe'); // 'recipe' or 'history'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRecipe({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert('레시피를 찾을 수 없습니다.');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'recipes', id));
      navigate('/');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('삭제 실패');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ChefHat className="w-16 h-16 text-primary-500 animate-pulse" />
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-2">
          <Link
            to={`/recipe/edit/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 대표 이미지 */}
      {recipe.thumbnailUrl && (
        <div className="w-full aspect-video rounded-xl overflow-hidden mb-6">
          <img 
            src={recipe.thumbnailUrl} 
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 제목 */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
        {recipe.title}
      </h1>

      {/* 태그 */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map((tag, idx) => (
            <span 
              key={idx}
              className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 탭 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('recipe')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'recipe'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            레시피
            {activeTab === 'recipe' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            조리 기록
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'recipe' ? (
        <RecipeInfo recipe={recipe} />
      ) : (
        <CookingHistory recipeId={id} />
      )}
    </div>
  );
}

function RecipeInfo({ recipe }) {
  return (
    <div className="space-y-6">
      {/* 출처 */}
      {recipe.source && recipe.source.type !== '직접' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <LinkIcon className="w-5 h-5 mr-2" />
            출처
          </h3>
          <p className="text-gray-700">{recipe.source.type}</p>
          {recipe.source.description && (
            <p className="text-gray-600 text-sm mt-1">{recipe.source.description}</p>
          )}
          {recipe.source.url && (
            <a 
              href={recipe.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
            >
              링크 열기 →
            </a>
          )}
        </div>
      )}

      {/* 재료 */}
      {recipe.ingredients && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">재료</h3>
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {recipe.ingredients}
          </pre>
        </div>
      )}

      {/* 만드는 법 */}
      {recipe.instructions && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">만드는 법</h3>
          <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
            {recipe.instructions}
          </pre>
        </div>
      )}

      {/* 추가 사진들 */}
      {recipe.images && recipe.images.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-3">사진</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recipe.images.map((url, idx) => (
              <img 
                key={idx}
                src={url} 
                alt={`Image ${idx + 1}`}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CookingHistory({ recipeId }) {
  const [history, setHistory] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'recipes', recipeId, 'cookingHistory'),
      orderBy('cookedDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recipeId]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 추가 버튼 */}
      <button
        onClick={() => setShowAddForm(true)}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>조리 기록 추가</span>
      </button>

      {/* 추가 폼 */}
      {showAddForm && (
        <AddHistoryForm 
          recipeId={recipeId}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* 히스토리 리스트 */}
      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>아직 조리 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(entry => (
            <HistoryCard key={entry.id} entry={entry} recipeId={recipeId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddHistoryForm({ recipeId, onClose }) {
  const [formData, setFormData] = useState({
    cookedDate: new Date().toISOString().split('T')[0],
    event: '',
    reason: '',
    review: '',
    improvements: '',
    rating: 0,
    photos: []
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `history/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, url]
      }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('사진 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await addDoc(collection(db, 'recipes', recipeId, 'cookingHistory'), {
        ...formData,
        cookedDate: new Date(formData.cookedDate),
        rating: Number(formData.rating),
        createdAt: serverTimestamp()
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding history:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">조리 기록 추가</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            언제 만들었나요?
          </label>
          <input
            type="date"
            name="cookedDate"
            value={formData.cookedDate}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            어떤 계기로 만들었나요?
          </label>
          <input
            type="text"
            name="event"
            value={formData.event}
            onChange={handleChange}
            placeholder="예: 친구 초대, 주말 저녁, 생일..."
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            만든 이유
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="왜 이 요리를 만들기로 했나요?"
            rows="3"
            className="textarea-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            별점
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                className="p-1"
              >
                <Star 
                  className={`w-8 h-8 ${
                    star <= formData.rating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            어땠나요?
          </label>
          <textarea
            name="review"
            value={formData.review}
            onChange={handleChange}
            placeholder="맛, 느낌, 반응 등을 자유롭게 적어주세요"
            rows="4"
            className="textarea-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            다음엔 이렇게 해볼까요?
          </label>
          <textarea
            name="improvements"
            value={formData.improvements}
            onChange={handleChange}
            placeholder="개선할 점, 다음에 시도해볼 것들"
            rows="4"
            className="textarea-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사진
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.photos.map((url, idx) => (
              <div key={idx} className="relative">
                <img 
                  src={url} 
                  alt={`Photo ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            <label className="cursor-pointer">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary-500 transition-colors">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-primary flex-1"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryCard({ entry, recipeId }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'recipes', recipeId, 'cookingHistory', entry.id));
    } catch (error) {
      console.error('Error deleting history:', error);
      alert('삭제 실패');
    }
  };

  return (
    <div className="card p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <Calendar className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-gray-900">
              {entry.cookedDate?.toDate ? 
                entry.cookedDate.toDate().toLocaleDateString('ko-KR')
                : '날짜 없음'
              }
            </span>
          </div>
          {entry.event && (
            <p className="text-sm text-gray-600 ml-8">{entry.event}</p>
          )}
        </div>

        {/* 별점 */}
        {entry.rating > 0 && (
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-5 h-5 ${
                  i < entry.rating 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 내용 */}
      {entry.reason && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">만든 이유</p>
          <p className="text-gray-600">{entry.reason}</p>
        </div>
      )}

      {entry.review && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">느낀 점</p>
          <p className="text-gray-600">{entry.review}</p>
        </div>
      )}

      {entry.improvements && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">다음엔 이렇게</p>
          <p className="text-gray-600">{entry.improvements}</p>
        </div>
      )}

      {/* 사진들 */}
      {entry.photos && entry.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {entry.photos.map((url, idx) => (
            <img 
              key={idx}
              src={url} 
              alt={`Photo ${idx + 1}`}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      {/* 삭제 버튼 */}
      <div className="pt-2 border-t border-gray-100">
        {showDeleteConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              확인
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
