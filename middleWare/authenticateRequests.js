const { admin } = require("../auth/initializeFirebase");
const { Error401Handler, Error403Handler, Error400Handler } = require("../errorHandling/errorHandlers");
const { Company } = require("../models/company");
const { UserModel } = require("../models/user");
const { VendorModel } = require("../models/vendor");
const mongoose = require("mongoose")


const authenticate = async (req, res, next) => {
    try {
        try {
            const { authToken } = req.cookies
            console.log(req.cookies);
            console.log({authToken});

        const user = await authenticateUserToken(authToken)
        console.log({user});

        if (user?.error?.failed) {
            throw new Error401Handler("Could not validate your portal account.")
        } else {
            console.log({user});
            req.user = user

            //Fetch user record from DB
            const userRecord = await UserModel.findOne({uid: user.uid})

            if (userRecord) {
                req.userRecord = userRecord
                next()
            } else {
                throw new Error403Handler("Your user details could not be validated and access has been denied.")
            }
            
        }
        } catch (error) {
            console.log({error});
            
            // console.log({error: error.error.failed});
            if (error?.error?.failed) {
                throw new Error401Handler("You are not currently logged in.")
            }
        }

    } catch (error) {
        next(error)
    }
}

const authenticateUserToken = (authToken) => {
    return new Promise(async (resolve, reject) => {
        
        //The following block of code is constructed this way to make sure that the server doesn't crash if authentication is not successful.
        try {
            admin.auth().verifyIdToken(authToken).then(result => {
                resolve(result)
            }).catch(error => {
                reject ({
                    error: {
                        failed: true,
                        message: "Could not complete this operation because you're currently not logged in. Please log in and try again."
                    }
                })
            })
        } catch (error1) {
            console.log({error1: error1.message});
            reject ({
                error: {
                    failed: true,
                    message: error1.message
                }
            })
        }
    })
}



module.exports = authenticate