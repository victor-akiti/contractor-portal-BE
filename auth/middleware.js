import { verifyToken } from "@shared";

const authenticate = async (req , res, next) => {
    try {
        const { authToken } = req.cookies
        console.log({authToken});

        verifyToken(authToken).then(result => {
            next()
        }).catch(error => {
            res.status(401).send({status: "Failed", error: {message: "You are not permitted to access this resource"}})
        })
    } catch (error) {
        res.status(401).send({status: "Failed", error: {message: "You are not permitted to access this resource"}})
    }
}

export default authenticate
