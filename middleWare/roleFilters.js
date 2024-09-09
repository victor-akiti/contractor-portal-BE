const { Error403Handler } = require("../errorHandling/errorHandlers")

exports.checkIfUserHasPermissions = (allowedRoles) => {

    
    return (req, res, next) => {
        try {
            console.log({allowedRoles, user: req.userRecord});
            if (allowedRoles.includes(req.userRecord.role)) {
                next()
            } else {
                throw new Error403Handler("You do not have the required permissions for this action.")
            }
        } catch (error) {
            next(error)
        }
    }
}