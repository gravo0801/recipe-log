# 나의 레시피 📖

집에서 만든 요리를 기록하고 조리 이력을 관리하는 웹 앱입니다.

## 주요 기능

- ✅ 레시피 저장 및 관리 (재료, 만드는 법, 사진, 출처)
- ✅ 조리 이력 기록 (날짜, 계기, 느낀 점, 개선 사항)
- ✅ 태그 및 검색 기능
- ✅ 웹/모바일 반응형 디자인
- ✅ PWA 지원 (모바일 홈화면 추가 가능)
- ✅ 실시간 동기화 (Firestore)

## 기술 스택

- **프론트엔드**: React, Vite, Tailwind CSS
- **백엔드**: Firebase (Firestore, Storage)
- **배포**: Vercel
- **버전관리**: GitHub

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone <your-repo-url>
cd recipe-log
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Firebase Storage 활성화 (Blaze 플랜 필요)
4. 프로젝트 설정에서 웹 앱 추가
5. Firebase 설정 정보를 복사하여 `src/config/firebase.js`에 입력

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore 보안 규칙 설정

Firebase Console > Firestore Database > 규칙에서:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recipes/{recipeId} {
      allow read, write: if true;
      
      match /cookingHistory/{historyId} {
        allow read, write: if true;
      }
    }
  }
}
```

### 4. Storage 보안 규칙 설정

Firebase Console > Storage > 규칙에서:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **주의**: 프로덕션 환경에서는 적절한 인증 규칙을 설정하세요.

### 5. 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## Vercel 배포

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Vercel 배포

1. [Vercel](https://vercel.com) 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. "Deploy" 클릭

배포 완료! 🎉

## 데이터 구조

### recipes (collection)
```javascript
{
  title: "김치찌개",
  ingredients: "재료 목록...",
  instructions: "만드는 법...",
  source: {
    type: "유튜브" | "웹사이트" | "AI" | "직접" | "기타",
    url: "https://...",
    description: "백종원 레시피"
  },
  thumbnailUrl: "https://...",
  images: ["url1", "url2"],
  tags: ["한식", "찌개"],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### cookingHistory (subcollection)
```javascript
{
  cookedDate: timestamp,
  event: "친구 초대",
  reason: "친구가 와서...",
  review: "맛있었음",
  improvements: "다음엔 돼지고기 더 넣기",
  rating: 4.5,
  photos: ["url1", "url2"],
  createdAt: timestamp
}
```

## PWA 설치

### iOS (Safari)
1. Safari에서 앱 접속
2. 공유 버튼 탭
3. "홈 화면에 추가" 선택

### Android (Chrome)
1. Chrome에서 앱 접속
2. 메뉴 (⋮) 탭
3. "홈 화면에 추가" 선택

## 개발 팁

- 이미지 업로드는 Firebase Storage를 사용 (Blaze 플랜 필요)
- 실시간 동기화로 여러 기기에서 자동 동기화
- 오프라인 지원 (Firebase 캐시 활용)
- Tailwind CSS 유틸리티 클래스 활용

## 라이선스

MIT

---

만든이: Gravo
