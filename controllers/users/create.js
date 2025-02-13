const { Error400Handler, Error403Handler, Error500Handler } = require("../../errorHandling/errorHandlers")
const { sendBasicResponse } = require("../../helpers/response")
const { UserModel } = require("../../models/user")

exports.createEndUser = async (req, res, next) => {
    try {
        const {name, email, department} = req.body

        //Validate request body
        if (!name || !email || !department) {
            throw new Error400Handler("New end users must have a name, email address and department.")
        }

        //Check if email is already registered
        const existingUser = await UserModel.findOne({email})

        if (existingUser) {
            throw new Error403Handler("An end user with this email address already exists.")
        }
        
        const newEndUser = new UserModel({
            name,
            email,
            department,
            role: "Amni Staff"
        })

        const savedNewEndUser = await newEndUser.save()

        if (savedNewEndUser) {
            sendBasicResponse(res, savedNewEndUser)
        } else {
            throw new Error500Handler("Could not create new end user. Please try again or contact IT Administrator.")
        }
        
    } catch (error) {
        next(error)
    }
}