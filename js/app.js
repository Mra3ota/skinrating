// js/app.js
// ---- простой модуль для инициализации Firebase и Google Sign-In
// вставь/проверь firebaseConfig — я использую ту же структуру, что у тебя в index.html

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/*
  вставь сюда firebaseConfig из твоего index.html
  если у тебя уже есть config в index.html — просто скопируй объект сюда
*/
const firebaseConfig = {
  apiKey: "AIzaSyBTClf2FpsEGwBBP6hFNFV2Zn8DordYLkA",
  authDomain: "skinsrzt.firebaseapp.com",
  projectId: "skinsrzt",
  storageBucket: "skinsrzt.appspot.com",
  messagingSenderId: "1084042281569",
  appId: "1:1084042281569:web:25872944cf7dac7fd66020"
};

let app, db, auth, provider;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  console.log('firebase initialized');
} catch (err) {
  console.error('firebase init error', err);
  // ничего критичного: в UI можно показать сообщение
}

// ---- простая UI-кнопка входа/выхода
// добавим кнопку в header автоматически, чтобы не править html
function ensureAuthButton() {
  let header = document.querySelector('.container header');
  if (!header) header = document.body;

  // контейнер для кнопки
  let ctrl = document.getElementById('auth-controls');
  if (!ctrl) {
    ctrl = document.createElement('div');
    ctrl.id = 'auth-controls';
    ctrl.style.cssText = 'position:absolute; right:20px; top:18px;';
    header.appendChild(ctrl);
  }

  // кнопки
  ctrl.innerHTML = `
    <button id="btn-signin" style="display:none;padding:6px 10px;border-radius:8px;border:none;cursor:pointer;background:#8a2be2;color:#fff;margin-left:8px;">Войти через Google</button>
    <button id="btn-signout" style="display:none;padding:6px 10px;border-radius:8px;border:none;cursor:pointer;background:#555;color:#fff;margin-left:8px;">Выйти</button>
    <span id="auth-name" style="display:none;color:#ccc;margin-left:8px;font-size:0.9em;"></span>
  `;

  document.getElementById('btn-signin').addEventListener('click', async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      // onAuthStateChanged обработает создание пользователя
      console.log('signed in', res.user.uid);
    } catch (e) {
      console.error('signin error', e);
      alert('Ошибка входа: ' + (e.message || e));
    }
  });

  document.getElementById('btn-signout').addEventListener('click', async () => {
    try {
      await signOut(auth);
      console.log('signed out');
    } catch (e) {
      console.error('signout error', e);
    }
  });
}

// вызываем создание кнопки
ensureAuthButton();

// ---- когда пользователь входит — создаём users/{uid} если его нет
onAuthStateChanged(auth, async (user) => {
  const signinBtn = document.getElementById('btn-signin');
  const signoutBtn = document.getElementById('btn-signout');
  const nameSpan = document.getElementById('auth-name');

  if (user) {
    // показать имя и кнопку выход
    if (signinBtn) signinBtn.style.display = 'none';
    if (signoutBtn) signoutBtn.style.display = 'inline-block';
    if (nameSpan) { nameSpan.style.display = 'inline'; nameSpan.textContent = user.displayName || user.email || 'user'; }

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        // создаём документ пользователя
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || null,
          email: user.email || null,
          photoURL: user.photoURL || null,
          isCreator: false,
          joinedAt: serverTimestamp()
        });
        console.log('user doc created:', user.uid);
      } else {
        // можно обновить имя/фото при необходимости (опционально)
        // await setDoc(userRef, { displayName: user.displayName }, { merge: true });
      }
    } catch (e) {
      console.error('error creating user doc', e);
    }

    // делаем current user доступным глобально
    window.currentUser = user;

  } else {
    // нет пользователя — показать кнопку вход
    if (signinBtn) signinBtn.style.display = 'inline-block';
    if (signoutBtn) signoutBtn.style.display = 'none';
    if (nameSpan) { nameSpan.style.display = 'none'; nameSpan.textContent = ''; }
    window.currentUser = null;
  }
});

// ---- Утилиты, которые понадобятся в других скриптах
export function getDb() { return db; }
export function getAuthInstance() { return auth; }
export function getCurrentUser() { return auth?.currentUser || null; }
export function isSignedIn() { return !!(auth && auth.currentUser); }

// небольшой рендер статуса внизу страницы (необязательно)
(function renderFooterStatus(){
  const footer = document.createElement('div');
  footer.style.cssText = 'position:fixed;left:10px;bottom:10px;color:#999;font-size:12px;';
  footer.id = 'firebase-status';
  footer.textContent = 'firebase: ready';
  document.body.appendChild(footer);
})();
