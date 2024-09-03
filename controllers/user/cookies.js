const { admin } = require("../../auth/initializeFirebase");
const { UserModel } = require("../../models/user");

const setCookies = async (req, res, next) => {
    console.log("setting cookies");
    
    const authToken = req.headers["token"]

    console.log({authToken});

    setUserCookies(res, authToken)

    

    
    
}

const setUserCookies = (res, authToken) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
    res.setHeader('Access-Control-Allow-Credentials', "true")
    const jwt = require("jsonwebtoken")
    const token = jwt.sign(authToken, process.env.JWT_SECRET)

    console.log({token});

    //Check user role and return appropriate role in response
    admin.auth().verifyIdToken(authToken).then(async result => {
        console.log({result});
        const user = await UserModel.findOne({uid: result.uid})

        console.log({user});

        if (user) {
            res.cookie("authToken", authToken, {
                httpOnly: true
            })

            console.log({user});
        
        
            res.status(200).send({status: "OK", data: {user}})
        }
    }).catch(error => {
        console.log({error});
        reject ({
            error: {
                failed: true,
                message: "Could not complete this operation because you're currently not logged in. Please log in and try again."
            }
        })
    })
}

module.exports = {
    setCookies,
    setUserCookies
}
