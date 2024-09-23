const { Error400Handler } = require("../../errorHandling/errorHandlers")
const { sendBasicResponse } = require("../../helpers/response")
const { UserModel } = require("../../models/user")

exports.updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params
        const { role, replace } = req.body
        

        //Check if any user exists that is CO, GM, HOD or GMD and is an active account
        
        if (["CO", "GM", "HOD", "GMD"].includes(role)) {
            const user = await UserModel.findOne({role})

            if (user) {
                if (user._id === id) {
                    throw new Error400Handler("This user already holds this role")
                } else if (user && !user.isSuspended) {
                    if (replace === true) {
                        const updatedUser = await UserModel.findByIdAndUpdate(id, {role}, {new: true})
                        const replaceCurrentRoleHolder = await UserModel.findByIdAndUpdate(user._id, {role: "C and P Staff"}, {new: true})
                        sendBasicResponse(res, updatedUser)
                    } else {
                        res.status(400).send({status: "Failed", user, error: {message: "User with this role already exists"}})
                    }
                    
                }
            } else {
                const updatedUser = await UserModel.findByIdAndUpdate(id, {role}, {new: true})
            sendBasicResponse(res, updatedUser)
            }

            
        } else {
            const updatedUser = await UserModel.findByIdAndUpdate(id, {role}, {new: true})
            sendBasicResponse(res, updatedUser)
        }
        

        return
        
        
    } catch (error) {
        next(error)
    }
}

exports.updateDepartment = async (req, res, next) => {
    try {
        const { id } = req.params
        const { department } = req.body
        console.log({id, department});
        
        const updatedUser = await UserModel.findByIdAndUpdate(id, {department}, {new: true})
        sendBasicResponse(res, updatedUser)

    } catch (error) {
        next(error)
    }
}