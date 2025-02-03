const { admin } = require("../../auth/initializeFirebase");
const { Error401Handler } = require("../../errorHandling/errorHandlers");
const { UserModel } = require("../../models/user");

const setCookies = async (req, res, next) => {
    console.log("setting cookies");
    
    const authToken = req.headers["token"]

    console.log({authToken});

    setUserCookies(res, authToken, next)

    

    
    
}

const setUserCookies = (res, authToken, next) => {
    try {
        res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL)
    res.setHeader('Access-Control-Allow-Credentials', "true")
    const jwt = require("jsonwebtoken")
    const token = jwt.sign(authToken, process.env.JWT_SECRET)

    console.log({token});

    //Check user role and return appropriate role in response
    admin.auth().verifyIdToken(authToken).then(async result => {
        console.log({result: result.firebase});
        const user = await UserModel.findOne({uid: result.uid})

        console.log({user});

        if (user) {
            res.cookie("authToken", authToken, {
                httpOnly: true,
                sameSite: "none", 
                secure: true
            })

            console.log({user});
        
        
            res.status(200).send({status: "OK", data: {user}})
        } else {
            //Create user record in mongoDB

            console.log({theUserrecord: result});

            const emailSignature = String(result.email).split("@")[1]

            if (emailSignature === "amni.com") {
                const newUser = new UserModel({
                    uid: result.uid,
                    email: result.email,
                    role: "Amni Staff",
                    name: result.name,
                    providerId: result.firebase.sign_in_provider,
                })
    
                const savedNewUser = await newUser.save()
    
                if (savedNewUser) {
                    res.cookie("authToken", authToken, {
                        httpOnly: true,
                        sameSite: "none", 
                        secure: true
                    })
                    
                    console.log({savedNewUser});
                    
                
                
                    res.status(200).send({status: "OK", data: {user: savedNewUser}})
                } else {
                    throw new Error500Handler("An error occured and your user account couldn't be created. Please try again later.")
                }
            } else {
                throw new Error500Handler("Only Amni staff accounts can log into the staff portal.")
            }
            
            

            
        }
    }).catch(error => {
        console.log({error});
        throw new Error401Handler("Could not complete this operation because you're currently not logged in. Please log in and try again.")
    })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    setCookies,
    setUserCookies
}
