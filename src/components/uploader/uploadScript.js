
/**
 * NOTE: This script currently doesn't work
 * there seems to be a problem with `firebase.initializeApp()`
 */


// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
const firebase = require("firebase/app");
// Add the Firebase products that you want to use
require("firebase/database");

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
const fbDatabase = firebase.database();

function writeSubjectCourseData(subjectArea, courseDataList) {
  const dbData = { courses: courseDataList };
  // console.log("courses: { " + subjectArea + ": ", dbData, "}");
  return fbDatabase.ref('courses/' + subjectArea).set(dbData)
    .then(function() {
      console.log('Synchronization succeeded');
    })
    .catch(function(error) {
      console.log('Synchronization failed');
    });
}

function deleteData() {
  var adaRef = fbDatabase.ref('users/ada');
  adaRef.remove()
    .then(function() {
      console.log("Remove succeeded.")
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message)
    });
}

const data = require('./components/sampleData.json');
// console.log("All data: ", data);

const comp = data.filter(x => x.code.substring(0,4) === "COMP");
// console.log("COMP: ", comp);

const seng = data.filter(x => x.code.substring(0,4) === "SENG");
// console.log("SENG: ", seng);

const math = data.filter(x => x.code.substring(0,4) === "MATH");
// console.log("MATH: ", math);

// let writePromise = writeSubjectCourseData("MATH", math);
// writePromise.wa

// fbDatabase.ref('courses/' + "MATH").set({ courses: math })
//   .then(function() {
//     console.log('Synchronization succeeded');
//   })
//   .catch(function(error) {
//     console.log('Synchronization failed');
//   });


const timeoutPromise = (time) => {
  return new Promise((resolve, reject) => { setTimeout(() =>
  { console.log('howdy'); resolve('done') }, time) })
}

console.log('start')
timeoutPromise(3000)
console.log('end')

// console.log('start')
// return timeoutPromise(1000)
// console.log('end')

// console.log('start')
// return timeoutPromise(3000).then((result) => {
//     console.log('end', result)
//     process.exit(123)  // usually 0 for 'ok', just demo!
//   }
// )
