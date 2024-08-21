// Import the functions you need from the SDKs you need    
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";

import { 
  getAnalytics 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";

import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  setPersistence,
  signInWithRedirect,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js'

import {
  getDatabase,
  set,
  child,
  get,
  onValue
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js';

import {
  getFirestore, 
  addDoc, 
  collection, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocFromCache,
  doc, 
  limit,
  onSnapshot, 
  serverTimestamp , 
  orderBy , 
  query,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED 
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

import {
  getStorage,
  ref, 
  uploadBytes,
  uploadBytesResumable, 
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js'
// TODO: Add SDKs for Firebase products that you want to use    2
// https://firebase.google.com/docs/web/setup#available-libraries    

const mySignInButton = document.getElementById('sign-in-button')
const myLogOutButton = document.getElementById('logout-button')
const loader = document.getElementById('loader')

// Your web app's Firebase configuration    
// For Firebase JS SDK v7.20.0 and later, measurementId is optional    

const firebaseConfig = {
  apiKey: "AIzaSyDH2zLoy7eKUeOZiKvvK5hqeYBITE8swrg",
  authDomain: "pwa-llamaindex.firebaseapp.com",
  databaseURL: "https://pwa-llamaindex-default-rtdb.firebaseio.com",
  projectId: "pwa-llamaindex",
  storageBucket: "pwa-llamaindex.appspot.com",
  messagingSenderId: "75136908758",
  appId: "1:75136908758:web:755dd320582203621e7877",
  measurementId: "G-TZY11KZ6YQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app ,"users", {
  localCache: persistentLocalCache(/*settings*/{tabManager: persistentMultipleTabManager()}),
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});
const storage = getStorage(app); 

if (myLogOutButton) myLogOutButton.addEventListener('click', logout)
if (mySignInButton) mySignInButton.addEventListener('click', signInClicked)

function signInClicked() {
  loader.style.display = "flex"
  toggleSignIn()
}

function toggleSignIn() {
  mySignInButton.disabled = true;
  if (auth.currentUser) console.log(auth.currentUser)
  const provider = new GoogleAuthProvider();
  // const result = signInWithRedirect(auth, provider)

  signInWithPopup(auth, provider)
    .then((result) => {
      console.log('User signed in !')
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      window.location.replace("./page.html");
      // IdP data available using getAdditionalUserInfo(result)
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    })
}

function logout() {
  signOut(auth).then(() => {
    window.location.replace("./");
    console.log('ign-out successful.')
  }).catch((error) => {
    console.log(error)
  });
}

export {
  auth, onAuthStateChanged,
  getDatabase, set, child, get, onValue,
  db, setDoc, addDoc, collection, getFirestore, updateDoc, getDoc, getDocFromCache, doc,onSnapshot, serverTimestamp ,orderBy, query,limit,
  getStorage, ref, uploadBytes , storage,
  uploadBytesResumable, 
  getDownloadURL,
}
