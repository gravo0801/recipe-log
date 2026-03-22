import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { ArrowLeft, Upload, X, Link as LinkIcon } from 'lucide-react';

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    source: {
      type: '직접',
      url: '',
      description: ''
    },
    tags: [],
    thumbnailUrl: '',
    images: []
  });

  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 수정 모드일 때 기존 데이터 불러오기
  useEffect(() => {
    if (isEditing) {
      loadRecipe();
    }
  }, [id]);

  const loadRecipe = async () => {
    try {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      alert('레시피를 불러올 수 없습니다.');
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSourceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      source: { ...prev.source, [field]: value }
    }));
  };

  const handleImageUpload = async (e, isThumbnail = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `recipes/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (isThumbnail) {
        setFormData(prev => ({ ...prev, thumbnailUrl: url }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          images: [...(prev.images || []), url] 
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      const recipeData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, 'recipes', id), recipeData);
      } else {
        recipeData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'recipes'), recipeData);
      }

      navigate('/');
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? '레시피 수정' : '새 레시피'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            요리 이름은 무엇인가요?
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 김치찌개, 된장국, 파스타..."
            className="input-field"
            required
          />
        </div>

        {/* 출처 */}
        <div className="card p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            어디서 본 레시피인가요?
          </label>
          
          <div className="flex flex-wrap gap-2">
            {['직접', '유튜브', '웹사이트', 'AI', '기타'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleSourceChange('type', type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.source.type === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {formData.source.type !== '직접' && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  링크 (선택사항)
                </label>
                <input
                  type="url"
                  value={formData.source.url}
                  onChange={(e) => handleSourceChange('url', e.target.value)}
                  placeholder="https://..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  설명 (선택사항)
                </label>
                <input
                  type="text"
                  value={formData.source.description}
                  onChange={(e) => handleSourceChange('description', e.target.value)}
                  placeholder="예: 백종원 레시피, 엄마 비법"
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>

        {/* 재료 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            재료
          </label>
          <p className="text-sm text-gray-500 mb-3">
            자유롭게 적어주세요 (줄바꿈으로 구분)
          </p>
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            placeholder="돼지고기 300g&#10;김치 1/4포기&#10;두부 1모&#10;대파 1대&#10;고춧가루 1큰술"
            rows="8"
            className="textarea-field"
          />
        </div>

        {/* 만드는 법 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            만드는 법
          </label>
          <p className="text-sm text-gray-500 mb-3">
            편하게 작성해주세요
          </p>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="1. 김치를 먹기 좋은 크기로 썰어요&#10;2. 냄비에 기름을 두르고 돼지고기를 볶아요&#10;3. 김치를 넣고 함께 볶아요&#10;..."
            rows="12"
            className="textarea-field"
          />
        </div>

        {/* 사진 */}
        <div className="card p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            사진
          </label>

          {/* 썸네일 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">대표 사진</p>
            {formData.thumbnailUrl ? (
              <div className="relative inline-block">
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Thumbnail"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="inline-block cursor-pointer">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* 추가 사진들 */}
          <div>
            <p className="text-sm text-gray-600 mb-2">추가 사진</p>
            <div className="flex flex-wrap gap-2">
              {formData.images?.map((url, idx) => (
                <div key={idx} className="relative">
                  <img 
                    src={url} 
                    alt={`Image ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
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
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 태그 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            태그
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="태그 입력 후 Enter"
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={addTag}
              className="btn-secondary"
            >
              추가
            </button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span 
                  key={tag}
                  className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-primary flex-1"
          >
            {saving ? '저장 중...' : (isEditing ? '수정 완료' : '레시피 저장')}
          </button>
        </div>
      </form>
    </div>
  );
}
