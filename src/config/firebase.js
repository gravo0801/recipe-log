import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase 설정 - 본인의 Firebase 프로젝트 정보로 변경하세요
const firebaseConfig = {
  apiKey: "AIzaSyBSj12rE7VM5cuS25E_xe7TvGKFtfTq0BI",
  authDomain: "recipelog-b2160.firebaseapp.com",
  projectId: "recipelog-b2160",
  storageBucket: "recipelog-b2160.firebasestorage.app",
  messagingSenderId: "157595326727",
  appId: "1:157595326727:web:fbae950bf42737e2e4cda2",
  measurementId: "G-SEJRKQJF1Q"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 서비스 내보내기
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;
