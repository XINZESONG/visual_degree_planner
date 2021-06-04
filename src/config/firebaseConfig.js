// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAL1mJ94GO8tchNCqxBt74GSqByxlZPePM",
  authDomain: "visual-degree-planner.firebaseapp.com",
  databaseURL: "https://visual-degree-planner.firebaseio.com",
  projectId: "visual-degree-planner",
  storageBucket: "visual-degree-planner.appspot.com",
  messagingSenderId: "93575317774",
  appId: "1:93575317774:web:fcc5184c86365e4b366f5f",
  measurementId: "G-LW8BL77RNP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const databaseInstance = firebase.database();
export default firebase;
