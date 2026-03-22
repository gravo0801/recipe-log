# Firebase 설정 가이드 🔥

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `recipe-log`)
4. Google Analytics 설정 (선택사항, 건너뛰기 가능)
5. "프로젝트 만들기" 클릭

## 2단계: 웹 앱 추가

1. Firebase 프로젝트 개요 페이지에서
2. 웹 아이콘 `</>` 클릭
3. 앱 닉네임 입력 (예: `recipe-log-web`)
4. "Firebase 호스팅 설정" 체크 해제
5. "앱 등록" 클릭
6. **Firebase 설정 코드 복사** (다음 단계에서 사용)

## 3단계: Firestore Database 활성화

1. 왼쪽 메뉴에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. **프로덕션 모드**로 시작 선택
4. 위치 선택: `asia-northeast3 (Seoul)` 권장
5. "사용 설정" 클릭

### Firestore 보안 규칙 설정

1. "규칙" 탭 선택
2. 다음 규칙 붙여넣기:

```javascript
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

3. "게시" 클릭

⚠️ **주의**: 이 규칙은 누구나 접근 가능합니다. 나중에 인증을 추가하려면 규칙을 수정하세요.

## 4단계: Firebase Storage 활성화

1. 왼쪽 메뉴에서 "Storage" 선택
2. "시작하기" 클릭
3. **프로덕션 모드**로 시작 선택
4. 위치: Firestore와 동일한 위치 선택
5. "완료" 클릭

⚠️ **중요**: Storage는 **Blaze (종량제) 플랜**이 필요합니다!

### Storage 보안 규칙 설정

1. "Rules" 탭 선택
2. 다음 규칙 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. "게시" 클릭

### Blaze 플랜으로 업그레이드

1. 왼쪽 하단 톱니바퀴 아이콘 → "사용량 및 결제" 선택
2. "세부정보 및 설정" 탭
3. "플랜 수정" 클릭
4. "Blaze" 플랜 선택
5. 결제 정보 입력

💡 **참고**: 개인 앱 수준에서는 무료 할당량 내에서 사용 가능합니다.

## 5단계: Firebase 설정 파일 업데이트

1. 프로젝트의 `src/config/firebase.js` 파일 열기
2. 2단계에서 복사한 Firebase 설정 코드로 교체:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",  // 본인의 API Key
  authDomain: "recipe-log-xxxxx.firebaseapp.com",
  projectId: "recipe-log-xxxxx",
  storageBucket: "recipe-log-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

3. 파일 저장

## 6단계: 로컬 테스트

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 테스트:
- 레시피 추가 가능한지
- 이미지 업로드 되는지
- 조리 기록 추가 되는지

## 7단계: Vercel 배포

### GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit: Recipe Log App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/recipe-log.git
git push -u origin main
```

### Vercel에 배포

1. [Vercel](https://vercel.com) 로그인 (GitHub 계정으로)
2. "Add New Project" 클릭
3. GitHub 저장소 `recipe-log` 선택
4. 설정 확인:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. "Deploy" 클릭
6. 배포 완료! 🎉

배포된 URL: `https://recipe-log-xxx.vercel.app`

## 문제 해결

### "Firebase: Error (auth/api-key-not-valid)"
- `firebase.js`의 `apiKey`가 올바른지 확인

### 이미지 업로드 실패
- Firebase Storage가 활성화되었는지 확인
- Blaze 플랜으로 업그레이드했는지 확인
- Storage 보안 규칙이 올바른지 확인

### 데이터가 저장되지 않음
- Firestore Database가 활성화되었는지 확인
- Firestore 보안 규칙이 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### Vercel 배포 실패
- `package.json`의 dependencies가 모두 설치되었는지 확인
- `npm run build`가 로컬에서 성공하는지 확인

## 추가 보안 설정 (선택사항)

나중에 인증을 추가하려면:

1. Firebase Console → Authentication 활성화
2. 이메일/비밀번호 또는 Google 로그인 설정
3. `src/config/firebase.js`에 Auth 코드 추가
4. Firestore/Storage 규칙을 인증된 사용자만 접근 가능하도록 수정

---

설정 완료! 이제 어디서든 레시피를 기록하고 관리할 수 있습니다. 🎉
