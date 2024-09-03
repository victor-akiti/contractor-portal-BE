const { Error400Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { UserModel } = require("../../models/user");

exports.sendPasswordResetLink = async (req, res, next) => {
    try {
        console.log(req.body);
        const {email} = req.body.email

        //Check if account exists
        const user = await UserModel.findOne({
            email
        })

        if (!user) {
            throw new Error400Handler("An error occured. Please contact the system administrator for assistance.")
        }

        const firebase = require("firebase/app")
        const firebaseAuth = require("firebase/auth")

        const {initializeApp} = firebase
        const {getAuth, sendPasswordResetEmail} = require("firebase/auth")

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

        sendPasswordResetEmail(auth, email).then(result => {
            sendBasicResponse(res, {})
        }).catch(error => {
            console.log({error});
        })

    } catch (error) {
        next(error)
    }
}