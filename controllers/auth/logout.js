const { sendBasicResponse } = require("../../helpers/response")

exports.logUserOut = async (req, res, next) => {
    try {
        res.cookie("authToken", "", {
            httpOnly: true,
            sameSite: "none", 
            secure: true
        })
    
    
        sendBasicResponse(res, {})
        
    } catch (error) {
        next(error)
    }
}