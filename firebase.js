// firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database'; // Import Realtime Database instead of Firestore
import 'firebase/compat/storage'; // Import Firebase Storage


// firebaseConfig.js
export const firebaseConfig = {
  apiKey: "AIzaSyBG2St4s8g1UZC3p9r16S5kzDoLjkB7X5k",
  authDomain: "food2go-44539.firebaseapp.com",
  databaseURL: "https://food2go-44539-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "food2go-44539",
  storageBucket: "gs://food2go-44539.appspot.com",
  messagingSenderId: "844894233705" ,
  appId: "1:844894233705:android:0a77e59d1f12b2cda1eef8",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
