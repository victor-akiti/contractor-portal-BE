const firebase = require("firebase/app")
const firebaseAuth = require("firebase/auth")

const {initializeApp, } = firebase

const app = initializeApp({
    apiKey: "AIzaSyC0ZtnjPzHg6ieIeTYTuqwMiSgofrgulHw",
  authDomain: "amni-contractors.firebaseapp.com",
  databaseURL: "https://amni-contractors.firebaseio.com",
  projectId: "amni-contractors",
  storageBucket: "amni-contractors.appspot.com",
  messagingSenderId: "754512756573",
  appId: "1:754512756573:web:d5c79ebeca11ea64"
})

firebaseAuth.initializeAuth(app)

module.exports = {
    firebaseAuth
}