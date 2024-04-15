const { admin } = require("../auth/initializeFirebase");
const { Error401Handler } = require("../errorHandling/errorHandlers");


const authenticate = async (req, res, next) => {
    try {
        const { authToken } = req.cookies

        const user = await authenticateUserToken(authToken)

        if (user?.error?.failed) {
            throw new Error401Handler("Could not validate your portal account.")
        } else {
            req.user = user
            next()
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