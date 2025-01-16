
const { Error400Handler, Error500Handler, Error403Handler } = require("../../errorHandling/errorHandlers");
const { setUserCookies } = require("../user/cookies");


exports.logContractorIn = async (req, res, next) => {
    try {
        console.log(req.body);
        const {email, password} = req.body.loginDetails

        if (!email || !password) {
            throw new Error400Handler("You have to provide your email address and password to login")
        }

        const firebase = require("firebase/app")
        const firebaseAuth = require("firebase/auth")

        const {initializeApp} = firebase
        const {getAuth, signInWithEmailAndPassword} = require("firebase/auth")

        const app = initializeApp({
            apiKey: "AIzaSyC0ZtnjPzHg6ieIeTYTuqwMiSgofrgulHw",
        authDomain: "amni-contractors.firebaseapp.com",
        databaseURL: "https://amni-contractors.firebaseio.com",
        projectId: "amni-contractors",
        storageBucket: "amni-contractors.appspot.com",
        messagingSenderId: "754512756573",
        appId: "1:754512756573:web:d5c79ebeca11ea64"
        })


        const auth = getAuth(app)

        // signInWithEmailAndPassword(auth, email, password).then(async result => {
        //     const idToken = await result.user.getIdToken()
        //     setUserCookies(res, idToken)
        // }).catch(error => {
        //     console.log({error: error.code});
        //     handleLoginError(error)
        //     if (error.code === "auth/wrong-password") {
        //         throw new Error400Handler("Login failed. Please check your email and password.")
        //     } else {
        //         throw new Error500Handler("An internal error occured. Please try again later.")
        //     }
        // })

        try {
            let signUserIn = await signInWithEmailAndPassword(auth, email, password)

            console.log({signUserIn: signUserIn._tokenResponse.idToken});
            const idToken = signUserIn._tokenResponse.idToken
            setUserCookies(res, idToken)
        } catch (error) {
            console.log({errorCode: error.code});
            if (error.code === "auth/wrong-password") {
                throw new Error400Handler("Login Failed. Please check that your email address and password are correct")
            } else if (error.code === "auth/user-not-found") {
                throw new Error400Handler("Login Failed. Please check that your email address and password are correct")
            } else if (error.code === "auth/too-many-requests") {
                throw new Error403Handler(" You have tried to log in too many times in quick succession. Please wait for one minute then try again.")
            } else {
                throw new Error500Handler("An internal error occured. Please try again later.")
            }
        }

        

        

        
    } catch (error) {
        next(error)
    }
}

const handleLoginError = error => {

}